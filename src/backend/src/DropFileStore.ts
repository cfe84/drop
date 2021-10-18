import * as fs from "fs"
import * as path from "path"
import { Client } from "./Client";
import { CompositeDrop } from "./CompositeDrop";
import { Cypher } from "./Cypher";
import { Drop } from "./Drop";
import { IDropStorage } from "./IDropStorage";

interface ClientFileContent {
  client: Client,
  dropIds: string[],
  path: string
}

interface CypherFileContent {
  cypher: Cypher,
  dropIds: string[],
  path: string
}

interface DropFileContent {
  drop: Drop,
  path: string
}

export class DropFileStore implements IDropStorage {
  private clientsFolder: string
  private cypherFolder: string
  private dropsFolder: string

  constructor(folder: string) {
    this.clientsFolder = path.join(folder, "clients")
    this.dropsFolder = path.join(folder, "drops")
    this.cypherFolder = path.join(folder, "cyphers")
    fs.mkdirSync(this.clientsFolder, { recursive: true })
    fs.mkdirSync(this.dropsFolder, { recursive: true })
    fs.mkdirSync(this.cypherFolder, { recursive: true })
  }

  private getClientFileName(alias: string) {
    return path.join(this.clientsFolder, alias + ".json")
  }

  private getClientFile(alias: string): ClientFileContent {
    const clientFilePath = this.getClientFileName(alias)
    if (!fs.existsSync(clientFilePath)) {
      throw Error("Client not found")
    }
    const clientFile = JSON.parse(fs.readFileSync(clientFilePath).toString()) as ClientFileContent
    clientFile.path = clientFilePath
    return clientFile
  }

  private saveClientFile(clientFile: ClientFileContent) {
    const filePath = this.getClientFileName(clientFile.client.alias)
    clientFile.path = filePath
    fs.writeFileSync(filePath, JSON.stringify(clientFile))
  }

  async createClientAsync(client: Client): Promise<void> {
    const clientFilePath = this.getClientFileName(client.alias)
    if (fs.existsSync(clientFilePath)) {
      throw Error("UNIQUE")
    }
    const clientFile: ClientFileContent = {
      client,
      dropIds: [],
      path: clientFilePath
    }
    this.saveClientFile(clientFile)
  }

  private getCypherFileName(cypherId: string): string {
    return path.join(this.cypherFolder, cypherId + ".json")
  }

  private getCypherFile(cypherId: string): CypherFileContent {
    const cypherFilePath = this.getCypherFileName(cypherId)
    if (!fs.existsSync(cypherFilePath)) {
      throw Error("Cypher not found")
    }
    const cypherFile = JSON.parse(fs.readFileSync(cypherFilePath).toString()) as CypherFileContent
    cypherFile.path = cypherFilePath
    return cypherFile
  }

  private saveCypherFile(cypherFile: CypherFileContent) {
    const cypherFilePath = this.getCypherFileName(cypherFile.cypher.id)
    cypherFile.path = cypherFilePath
    fs.writeFileSync(cypherFilePath, JSON.stringify(cypherFile))
  }

  private getDropFileName(dropId: string): string {
    return path.join(this.dropsFolder, dropId + ".json")
  }

  private getDropFile(dropId: string): DropFileContent {
    const dropFilePath = this.getDropFileName(dropId)
    if (!fs.existsSync(dropFilePath)) {
      throw Error("Drop not found")
    }
    const dropFile = JSON.parse(fs.readFileSync(dropFilePath).toString()) as DropFileContent
    dropFile.path = dropFilePath
    return dropFile
  }

  private saveDropFile(dropFile: DropFileContent) {
    const dropFilePath = this.getDropFileName(dropFile.drop.id)
    dropFile.path = dropFilePath
    fs.writeFileSync(dropFilePath, JSON.stringify(dropFile))
  }

  async createDropAsync(drop: Drop): Promise<void> {
    const dropFilePath = this.getDropFileName(drop.id)
    const clientFile = this.getClientFile(drop.toAlias)
    if (fs.existsSync(dropFilePath)) {
      throw Error("UNIQUE")
    }
    const cypherFile = this.getCypherFile(drop.cypherId)
    const dropFile = {
      drop,
      path: dropFilePath
    } as DropFileContent
    this.saveDropFile(dropFile)
    clientFile.dropIds.push(drop.id)
    this.saveClientFile(clientFile)
    cypherFile.dropIds.push(drop.id)
    this.saveCypherFile(cypherFile)
  }

  async createCypherAsync(cypher: Cypher): Promise<void> {
    const cypherFilePath = this.getCypherFileName(cypher.id)
    if (fs.existsSync(cypherFilePath)) {
      throw Error("UNIQUE")
    }
    const cypherFile: CypherFileContent = {
      cypher,
      dropIds: [],
      path: cypherFilePath
    }
    this.saveCypherFile(cypherFile)
  }

  async getClientPublicKeyAsync(alias: string): Promise<string> {
    const clientFile = this.getClientFile(alias)
    return clientFile.client.publicKey
  }

  private validatePassword(client: Client, pass: string) {
    if (client.pass !== pass) {
      throw Error("Alias or password incorrect")
    }
  }

  async getDropsAndCyphersAsync(alias: string, pass: string): Promise<CompositeDrop[]> {
    const clientFile = this.getClientFile(alias)
    this.validatePassword(clientFile.client, pass)
    const drops = clientFile.dropIds.map(dropId => {
      const dropFile = this.getDropFile(dropId)
      const cypher = this.getCypherFile(dropFile.drop.cypherId).cypher
      return {
        createdDate: cypher.createdDate,
        dropId,
        publicKey: dropFile.drop.publicKey,
        encryptedKey: dropFile.drop.encryptedKey,
        encryptedText: cypher.encryptedText,
        fromAlias: dropFile.drop.fromAlias,
        deleteOnDisplay: dropFile.drop.deleteOnDisplay
      } as CompositeDrop
    })
    return drops
  }

  async deleteDropAsync(dropId: string, alias: string, pass: string): Promise<void> {
    const clientFile = this.getClientFile(alias)
    this.validatePassword(clientFile.client, pass)
    const dropFile = this.getDropFile(dropId)
    const cypherFile = this.getCypherFile(dropFile.drop.cypherId)
    const indexOfDropInClient = clientFile.dropIds.indexOf(dropId)
    if (indexOfDropInClient < 0 || dropFile.drop.toAlias !== alias) {
      throw Error(`FORBIDDEN`)
    }
    fs.unlinkSync(dropFile.path)
    clientFile.dropIds.splice(indexOfDropInClient, 1)
    this.saveClientFile(clientFile)
    const indexOfDropInCypher = cypherFile.dropIds.indexOf(dropId)
    if (indexOfDropInCypher < 0) {
      console.warn(`Drop not found in cypher`)
      return
    }
    // If this is the last drop of the cypher we delete it.
    cypherFile.dropIds.splice(indexOfDropInCypher, 1)
    if (cypherFile.dropIds.length === 0) {
      fs.unlinkSync(cypherFile.path)
    } else {
      this.saveCypherFile(cypherFile)
    }
  }
}