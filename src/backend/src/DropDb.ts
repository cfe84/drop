import { Database, Statement } from "sqlite3"
import { Client } from "./Client"
import { CompositeDrop } from "./CompositeDrop"
import { Cypher } from "./Cypher"
import { Drop } from "./Drop"

export class DropDb {
  private db: Database

  constructor(dbFile: string) {
    this.db = new Database(dbFile)
  }

  private insertQuery(query: string, ...params: any[]): Promise<void> {
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
    await this.insertQuery(`INSERT INTO clients
      (alias, pass, public_key)
      VALUES(?, ?, ?)`,
      client.alias, client.pass, client.publicKey)
  }

  public async createDropAsync(drop: Drop): Promise<void> {
    await this.insertQuery(`INSERT INTO drops
      (drop_id, from_alias, to_alias, encrypted_key, cypher_id)
      VALUES(?, ?, ?, ?, ?)`,
      drop.id, drop.fromAlias, drop.toAlias, drop.encryptedKey, drop.cypherId)
  }

  public async createCypherAsync(cypher: Cypher): Promise<void> {
    await this.insertQuery(`INSERT INTO cyphers
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
    const drops = await this.select(`SELECT drop_id, from_alias, encrypted_key, encrypted_text, created_date
    FROM drops
    INNER JOIN cyphers ON drops.cypher_id = cyphers.cypher_id
    WHERE to_alias = ?`, alias)
    return drops.map(row => ({
      dropId: row["drop_id"],
      fromAlias: row["from_alias"],
      encryptedKey: row["encrypted_key"],
      encryptedText: row["encrypted_text"],
      createdDate: row["created_date"],
    }))
  }
}
