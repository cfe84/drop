import { Database, Statement } from "sqlite3"
import { Client } from "./Client"
import { CompositeDrop } from "./CompositeDrop"
import { Cypher } from "./Cypher"
import { Drop } from "./Drop"
import { IDropStorage } from "./IDropStorage"

export class DropDb implements IDropStorage {
  private db: Database

  constructor(dbFile: string) {
    this.db = new Database(dbFile)
  }

  private alterQuery(query: string, ...params: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const statement = this.db.prepare(query, ...params)
      statement.run((err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  private select(query: string, ...params: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, ...params, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  public async createClientAsync(client: Client): Promise<void> {
    await this.alterQuery(`INSERT INTO clients
      (alias, pass, public_key)
      VALUES(?, ?, ?)`,
      client.alias, client.pass, client.publicKey)
  }

  public async createDropAsync(drop: Drop): Promise<void> {
    await this.alterQuery(`INSERT INTO drops
      (drop_id, from_alias, to_alias, encrypted_key, cypher_id, public_key)
      VALUES(?, ?, ?, ?, ?, ?)`,
      drop.id, drop.fromAlias, drop.toAlias, drop.encryptedKey, drop.cypherId, drop.publicKey)
  }

  public async createCypherAsync(cypher: Cypher): Promise<void> {
    await this.alterQuery(`INSERT INTO cyphers
      (cypher_id, encrypted_text, content_type, created_date)
      VALUES(?, ?, ?, ?)`,
      cypher.id, cypher.encryptedText, cypher.contentType, cypher.createdDate)
  }

  public async getClientPublicKeyAsync(alias: string): Promise<string> {
    const rows = await this.select(`SELECT public_key
      FROM clients
      WHERE alias = ?`, alias)
    if (rows.length !== 1) {
      throw Error(`Client not found`)
    }
    return rows[0]["public_key"]
  }

  public async getDropsAndCyphersAsync(alias: string, pass: string): Promise<CompositeDrop[]> {
    const client = await this.select(`SELECT alias
      FROM clients
      WHERE alias = ? AND pass = ?`, alias, pass)
    if (client.length !== 1) {
      throw Error(`Alias or password incorrect`)
    }
    const rows = await this.select(`SELECT drop_id, from_alias, encrypted_key, encrypted_text, created_date, delete_on_display, public_key
    FROM drops
    INNER JOIN cyphers ON drops.cypher_id = cyphers.cypher_id
    WHERE to_alias = ?`, alias)
    const drops = rows.map(row => ({
      dropId: row["drop_id"],
      fromAlias: row["from_alias"],
      encryptedKey: row["encrypted_key"],
      encryptedText: row["encrypted_text"],
      createdDate: row["created_date"],
      deleteOnDisplay: row["delete_on_display"],
      publicKey: row["public_key"]
    }))
    await Promise.all(drops.filter(drop => drop.deleteOnDisplay).map(drop => this.deleteDropAsync(drop.dropId, alias, pass)))
    return drops
  }

  public async deleteDropAsync(dropId: string, alias: string, pass: string): Promise<void> {
    const drop = await this.select(`SELECT drops.id as id, cypher_id
      FROM clients
      INNER JOIN drops ON clients.alias == drops.alias
      WHERE alias = ? AND pass = ? AND drops.id = ?`, alias, pass, dropId)
    if (drop.length !== 1) {
      throw Error(`Alias or password incorrect`)
    }
    const cypherId = drop[0]["cypher_id"]
    await this.alterQuery(`DELETE FROM drops
      WHERE id = ?`, dropId)
    const cypherDropCount = await this.select(`SELECT count(*) as cnt
      FROM drops
      WHERE cypher_id = ?`, cypherId)
    if (cypherDropCount[0]["cnt"] === 0) {
      await this.alterQuery(`DELETE FROM cyphers
      WHERE id = ?`, cypherId)
    }
  }
}
