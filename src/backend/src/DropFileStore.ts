import * as fs from "fs"
import * as path from "path"
import { Client } from "./Client";
import { CompositeDrop } from "./CompositeDrop";
import { Cypher } from "./Cypher";
import { Drop } from "./Drop";
import { IDropStorage } from "./IDropStorage";

interface ClientFileContent {
  client: Client,
  dropIds: string[]
}

interface CypherFileContent {
  cypher: Cypher,
  dropIds: string[]
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
    return clientFile
  }

  async createClientAsync(client: Client): Promise<void> {
    const clientFilePath = this.getClientFileName(client.alias)
    if (fs.existsSync(clientFilePath)) {
      throw Error("UNIQUE")
    }
    const clientFile: ClientFileContent = {
      client,
      dropIds: []
    }
    fs.writeFileSync(clientFilePath, JSON.stringify(clientFile))
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
    return cypherFile
  }

  private getDropFileName(dropId: string): string {
    return path.join(this.dropsFolder, dropId + ".json")
  }

  private getDropFile(dropId: string): Drop {
    const dropFilePath = this.getDropFileName(dropId)
    if (!fs.existsSync(dropFilePath)) {
      throw Error("Drop not found")
    }
    const dropFile = JSON.parse(fs.readFileSync(dropFilePath).toString()) as Drop
    return dropFile
  }

  async createDropAsync(drop: Drop): Promise<void> {
    const dropFilePath = this.getDropFileName(drop.id)
    const clientFilePath = this.getClientFileName(drop.toAlias)
    const clientFile = this.getClientFile(drop.toAlias)
    if (fs.existsSync(dropFilePath)) {
      throw Error("UNIQUE")
    }
    const cypherFilePath = this.getCypherFileName(drop.cypherId)
    const cypherFile = this.getCypherFile(drop.cypherId)
    fs.writeFileSync(dropFilePath, JSON.stringify(drop))
    clientFile.dropIds.push(drop.id)
    fs.writeFileSync(clientFilePath, JSON.stringify(clientFile))
    cypherFile.dropIds.push(drop.id)
    fs.writeFileSync(cypherFilePath, JSON.stringify(cypherFile))
  }

  async createCypherAsync(cypher: Cypher): Promise<void> {
    const cypherFilePath = this.getCypherFileName(cypher.id)
    if (fs.existsSync(cypherFilePath)) {
      throw Error("UNIQUE")
    }
    const cypherFile: CypherFileContent = {
      cypher,
      dropIds: []
    }
    fs.writeFileSync(cypherFilePath, JSON.stringify(cypherFile))
  }

  async getClientPublicKeyAsync(alias: string): Promise<string> {
    const clientFile = this.getClientFile(alias)
    return clientFile.client.publicKey
  }

  async getDropsAndCyphersAsync(alias: string, pass: string): Promise<CompositeDrop[]> {
    const clientFile = this.getClientFile(alias)
    if (clientFile.client.pass !== pass) {
      throw Error("Alias or password incorrect")
    }
    const drops = clientFile.dropIds.map(dropId => {
      const drop = this.getDropFile(dropId)
      const cypher = this.getCypherFile(drop.cypherId).cypher
      return {
        createdDate: cypher.createdDate,
        dropId,
        encryptedKey: drop.encryptedKey,
        encryptedText: cypher.encryptedText,
        fromAlias: drop.fromAlias
      } as CompositeDrop
    })
    return drops
  }

}