import { DropDb } from "./DropDb";
import { v4 as uuid } from "uuid";
import { DropServer } from "./DropServer";
import * as path from "path";

const dbFile = process.env.DB_FILE || "testdb.sqlite3"
const staticFolder = process.env.STATIC_CONTENT || path.join("..", "frontend")
const port = Number.parseInt(process.env.PORT || "8080")

const db = new DropDb(dbFile)
const server = new DropServer(db, { staticFolder, port })
server.startAsync()
