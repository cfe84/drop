import { Client } from "./Client";
import { CompositeDrop } from "./CompositeDrop";
import { Cypher } from "./Cypher";
import { Drop } from "./Drop";

export interface IDropStorage {
  checkClientPassAsync(alias: string, pass: string): Promise<boolean>
  createClientAsync(client: Client): Promise<void>
  createDropAsync(drop: Drop): Promise<void>
  createCypherAsync(cypher: Cypher): Promise<void>
  deactivateClientAsync(alias: string, pass: string): Promise<void>
  getClientPublicKeyAsync(alias: string): Promise<string>
  getDropsAndCyphersAsync(alias: string, pass: string): Promise<CompositeDrop[]>
  deleteDropAsync(dropId: string, alias: string, pass: string): Promise<void>
}
