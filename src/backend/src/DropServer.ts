import * as Express from "express"
import * as ws from "ws"
import { Client } from "./Client";
import { CompositeDrop } from "./CompositeDrop";
import { Drop } from "./Drop";
import { Cypher } from "./Cypher";
import { v4 as uuid } from "uuid"
import { IDropStorage } from "./IDropStorage";
import { Alias } from "./Alias";

export interface DropServerConfig {
  staticFolder: string,
  port: number,
  messageSizeLimit: number
}

interface QueryResult<T> {
  result: "success" | "error",
  data?: T,
  error?: string
}

interface DropAlias {
  alias: string,
  encryptedKey: string,
}

interface DropCreationRequest {
  toAliases: DropAlias[],
  fromAlias: string,
  encryptedText: string,
  deleteOnDisplay: boolean,
  publicKey?: string
}

export class DropServer {
  private app: Express.Application;
  private ws: ws.Server;
  private sockets: {
    [alias: string]: ws.WebSocket[]
  } = {}
  constructor(private db: IDropStorage, private config: DropServerConfig) {
    const app = Express()

    app.use(Express.static(config.staticFolder))
    app.use(Express.json())
    app.post("/api/clients", this.createClient.bind(this))
    app.get("/api/clients/:alias", this.getClient.bind(this))
    app.post("/api/clients/:alias/drops", this.createDrop.bind(this))
    app.post("/api/drops/", this.createDrop.bind(this))
    app.get("/api/clients/:alias/drops", this.getCompositeDrops.bind(this))
    app.delete("/api/clients/:alias/drops/:dropId", this.deleteDrop.bind(this))
    app.delete("/api/clients/:alias", this.deleteClient.bind(this))

    this.app = app
    this.ws = new ws.Server({ noServer: true })
    this.ws.on("connection", this.onconnect.bind(this))
  }

  private onconnect(socket: ws.WebSocket) {
    socket.once("message", (auth => {
      const { alias, pass } = JSON.parse(auth.toString())
      if (!this.sockets[alias]) {
        this.sockets[alias] = []
      }
      this.sockets[alias].push(socket)
      socket.on("close", (code, reason) => {
        this.ondisconnect(alias, socket)
      })
    }))
  }

  private findSocketForAlias(alias: string) {
    const sockets = this.sockets[alias]
    return sockets
  }

  private ondisconnect(alias: string, socket: ws.WebSocket) {
    const sockets = this.findSocketForAlias(alias)
    const index = sockets.indexOf(socket)
    sockets.splice(index)
  }

  startAsync(): Promise<void> {
    return new Promise((resolve) => {
      const server = this.app.listen(this.config.port, () => {
        console.log(`Listening on ${this.config.port}`)
        resolve()
      })
      server.on('upgrade', (request, socket, head) => {
        this.ws.handleUpgrade(request, socket as any, head, socket => {
          this.ws.emit('connection', socket, request);
        });
      });
    })
  }

  private handleError(err: Error, res: Express.Response): QueryResult<any> {
    if (err.message.indexOf("UNIQUE") >= 0) {
      res.statusCode = 409
      return {
        result: "error",
        error: "A resource with the same ID already exists"
      }
    } else if (err.message.indexOf("not found") >= 0) {
      res.statusCode = 404
      return {
        result: "error",
        error: err.message
      }
    } else if (err.message.indexOf("pass") >= 0) {
      res.statusCode = 401
      return {
        result: "error",
        error: err.message
      }
    } else if (err.message.indexOf("size") >= 0) {
      res.statusCode = 413
      return {
        result: "error",
        error: err.message
      }
    } else {
      console.error(err.message)
      res.statusCode = 500
      return {
        result: "error",
        error: "Server error"
      }
    }
  }

  async createClient(req: Express.Request, res: Express.Response) {
    const client = req.body as Client
    let response: QueryResult<Client>
    // Todo: validate payload
    try {
      const alias = Alias.getAlias()
      client.alias = alias.toLocaleLowerCase()
      await this.db.createClientAsync(client)
      response = {
        result: "success",
        data: client
      }
    } catch (err: any) {
      response = this.handleError(err, res)
    }
    res.send(response)
  }

  async deleteClient(req: Express.Request, res: Express.Response) {
    const alias = req.params["alias"].toLocaleLowerCase()
    const passHeader = req.headers.authorization
    const PASSWORD_TYPE = "Password "
    const pass = (passHeader && passHeader.startsWith(PASSWORD_TYPE)) ? passHeader.substr(PASSWORD_TYPE.length) : ""
    const drops = await this.db.getDropsAndCyphersAsync(alias, pass)
    await Promise.all(drops.map(drop => this.db.deleteDropAsync(drop.dropId, alias, pass)))
    await this.db.deactivateClientAsync(alias, pass)
    res.send({
      result: "success"
    })
  }

  async getClient(req: Express.Request, res: Express.Response) {
    const alias = req.params["alias"].toLocaleLowerCase()
    let response: QueryResult<Partial<Client>>
    try {
      const publicKey = await this.db.getClientPublicKeyAsync(alias)
      response = {
        result: "success",
        data: {
          alias,
          publicKey
        }
      }
    } catch (err: any) {
      response = this.handleError(err, res)
    }
    res.send(response)
  }

  private mapToComposite(drop: Drop, cypher: Cypher): Partial<CompositeDrop> {
    let encryptedKey = undefined
    let encryptedText = undefined
    let fromAlias = undefined
    let publicKey = undefined
    if (!drop.deleteOnDisplay) {
      encryptedKey = drop.encryptedKey
      encryptedText = cypher.encryptedText
      fromAlias = drop.fromAlias
      publicKey = drop.publicKey
    }
    return {
      createdDate: cypher.createdDate,
      deleteOnDisplay: drop.deleteOnDisplay,
      dropId: drop.id,
      encryptedKey,
      encryptedText,
      fromAlias: fromAlias,
      publicKey: publicKey
    }
  }

  private sendNotificationToSockets(drops: Drop[], cypher: Cypher) {
    drops.forEach(drop => {
      const sockets = this.findSocketForAlias(drop.toAlias)
      if (sockets) {
        const composite = this.mapToComposite(drop, cypher)
        sockets.forEach((socket, i) => {
          socket.send(JSON.stringify(composite))
        })
      }
    })
  }

  async createDrop(req: Express.Request, res: Express.Response) {
    const dropRequest = req.body as DropCreationRequest
    let response: QueryResult<Partial<CompositeDrop>>
    try {
      const ivSize = 18
      if (this.config.messageSizeLimit
        && dropRequest.encryptedText.length - ivSize > this.config.messageSizeLimit * 4 / 3) {
        throw Error("Maximum message size exceeded")
      }
      const cypher: Cypher = {
        contentType: "text/plain",
        createdDate: new Date(),
        encryptedText: dropRequest.encryptedText,
        id: uuid()
      }
      const drops: Drop[] = dropRequest.toAliases.map(alias => ({
        cypherId: cypher.id,
        toAlias: alias.alias.toLocaleLowerCase(),
        encryptedKey: alias.encryptedKey,
        fromAlias: dropRequest.fromAlias,
        deleteOnDisplay: dropRequest.deleteOnDisplay,
        publicKey: dropRequest.publicKey,
        id: uuid()
      }))
      await this.db.createCypherAsync(cypher)
      await Promise.all(drops.map(drop => this.db.createDropAsync(drop)))
      this.sendNotificationToSockets(drops, cypher)

      response = {
        result: "success",
        data: dropRequest
      }
    } catch (err: any) {
      response = this.handleError(err, res)
    }
    res.send(response)
  }

  async getCompositeDrops(req: Express.Request, res: Express.Response) {
    const forAlias = req.params["alias"].toLocaleLowerCase()
    const passHeader = req.headers.authorization
    const PASSWORD_TYPE = "Password "
    const pass = (passHeader && passHeader.startsWith(PASSWORD_TYPE)) ? passHeader.substr(PASSWORD_TYPE.length) : ""
    let response: QueryResult<CompositeDrop[]>
    try {
      const res = await this.db.getDropsAndCyphersAsync(forAlias, pass)
      await Promise.all(res
        .filter(drop => drop.deleteOnDisplay)
        .map(drop => this.db.deleteDropAsync(drop.dropId, forAlias, pass))
      )
      response = {
        result: "success",
        data: res
      }
    } catch (err: any) {
      response = this.handleError(err, res)
    }
    res.send(response)
  }

  async deleteDrop(req: Express.Request, res: Express.Response) {
    const alias = req.params["alias"]
    const dropId = req.params["dropId"]
    const passHeader = req.headers.authorization
    const PASSWORD_TYPE = "Password "
    const pass = (passHeader && passHeader.startsWith(PASSWORD_TYPE)) ? passHeader.substr(PASSWORD_TYPE.length) : ""
    let response: QueryResult<void>
    try {
      const res = await this.db.deleteDropAsync(dropId, alias, pass)
      response = {
        result: "success",
        data: res
      }
    } catch (err: any) {
      response = this.handleError(err, res)
    }
    res.send(response)
  }
}