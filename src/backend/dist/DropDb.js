"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropDb = void 0;
const sqlite3_1 = require("sqlite3");
class DropDb {
    constructor(dbFile) {
        this.db = new sqlite3_1.Database(dbFile);
    }
    insertQuery(query, ...params) {
        return new Promise((resolve, reject) => {
            const statement = this.db.prepare(query, ...params);
            statement.run((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    select(query, ...params) {
        return new Promise((resolve, reject) => {
            this.db.all(query, ...params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    createClientAsync(client) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.insertQuery(`INSERT INTO clients
      (alias, pass, public_key)
      VALUES(?, ?, ?)`, client.alias, client.pass, client.publicKey);
        });
    }
    createDropAsync(drop) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.insertQuery(`INSERT INTO drops
      (drop_id, from_alias, to_alias, encrypted_key, cypher_id)
      VALUES(?, ?, ?, ?, ?)`, drop.id, drop.fromAlias, drop.toAlias, drop.encryptedKey, drop.cypherId);
        });
    }
    createCypherAsync(cypher) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.insertQuery(`INSERT INTO cyphers
      (cypher_id, encrypted_text, content_type, created_date)
      VALUES(?, ?, ?, ?)`, cypher.id, cypher.encryptedText, cypher.contentType, cypher.createdDate);
        });
    }
    getClientPublicKeyAsync(alias) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.select(`SELECT public_key
      FROM clients
      WHERE alias = ?`, alias);
            if (rows.length !== 1) {
                throw Error(`Client not found`);
            }
            return rows[0]["public_key"];
        });
    }
    getDropsAndCyphersAsync(alias, pass) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.select(`SELECT alias
      FROM clients
      WHERE alias = ? AND pass = ?`, alias, pass);
            if (client.length !== 1) {
                throw Error(`Alias or password incorrect`);
            }
            const drops = yield this.select(`SELECT drop_id, from_alias, encrypted_key, encrypted_text, created_date
    FROM drops
    INNER JOIN cyphers ON drops.cypher_id = cyphers.cypher_id
    WHERE to_alias = ?`, alias);
            return drops.map(row => ({
                dropId: row["drop_id"],
                fromAlias: row["from_alias"],
                encryptedKey: row["encrypted_key"],
                encryptedText: row["encrypted_text"],
                createdDate: row["created_date"],
            }));
        });
    }
}
exports.DropDb = DropDb;
//# sourceMappingURL=DropDb.js.map