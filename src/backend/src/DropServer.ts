import * as Express from "express"
import { Client } from "./Client";
import { CompositeDrop } from "./CompositeDrop";
import { Drop } from "./Drop";
import { Cypher } from "./Cypher";
import { v4 as uuid } from "uuid"
import { IDropStorage } from "./IDropStorage";
import { Alias } from "./Alias";

export interface DropServerConfig {
  staticFolder: string,
  port: number
}

interface QueryResult<T> {
  result: "success" | "error",
  data?: T,
  error?: string
}

export class DropServer {
  private app: Express.Application;
  constructor(private db: IDropStorage, private config: DropServerConfig) {
    const app = Express()

    app.use(Express.static(config.staticFolder))
    app.use(Express.json())
    app.post("/api/clients", this.createClient.bind(this))
    app.get("/api/clients/:alias", this.getClient.bind(this))
    app.post("/api/clients/:alias/drops", this.createDrop.bind(this))
    app.get("/api/clients/:alias/drops", this.getCompositeDrops.bind(this))
    app.delete("/api/clients/:alias/drops/:dropId", this.deleteDrop.bind(this))

    this.app = app
  }

  startAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`Listening on ${this.config.port}`)
        resolve()
      })
    })
  }

  private handleDbError(err: Error, res: Express.Response): QueryResult<any> {
    if (err.message.indexOf("UNIQUE") >= 0) {
      res.statusCode = 409
      return {
        result: "error",
        error: "Alias already exists"
      }
    } else if (err.message.indexOf("not found") >= 0) {
      res.statusCode = 404
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
      client.alias = alias
      await this.db.createClientAsync(client)
      response = {
        result: "success",
        data: client
      }
    } catch (err: any) {
      response = this.handleDbError(err, res)
    }
    res.send(response)
  }

  async getClient(req: Express.Request, res: Express.Response) {
    const alias = req.params["alias"]
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
      response = this.handleDbError(err, res)
    }
    res.send(response)
  }

  async createDrop(req: Express.Request, res: Express.Response) {
    const compositeDrop = req.body as CompositeDrop
    const toAlias = req.params["alias"]
    let response: QueryResult<Partial<CompositeDrop>>
    try {
      const cypher: Cypher = {
        contentType: "text/plain",
        createdDate: new Date(),
        encryptedText: compositeDrop.encryptedText,
        id: uuid()
      }
      const drop: Drop = {
        cypherId: cypher.id,
        toAlias: toAlias,
        encryptedKey: compositeDrop.encryptedKey,
        fromAlias: compositeDrop.fromAlias,
        deleteOnDisplay: compositeDrop.deleteOnDisplay,
        id: uuid()
      }
      await this.db.createCypherAsync(cypher)
      await this.db.createDropAsync(drop)

      response = {
        result: "success",
        data: compositeDrop
      }
    } catch (err: any) {
      response = this.handleDbError(err, res)
    }
    res.send(response)
  }

  async getCompositeDrops(req: Express.Request, res: Express.Response) {
    const forAlias = req.params["alias"]
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
      response = this.handleDbError(err, res)
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
      response = this.handleDbError(err, res)
    }
    res.send(response)
  }
}