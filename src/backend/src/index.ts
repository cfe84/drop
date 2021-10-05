import { DropDb } from "./DropDb";
import { v4 as uuid } from "uuid";
import { DropServer } from "./DropServer";

const dbFile = "testdb.sqlite3"
const staticFolder = "..\\frontend"
const port = Number.parseInt(process.env.PORT || "8080")

const db = new DropDb(dbFile)
const server = new DropServer(db, { staticFolder, port })
server.startAsync()