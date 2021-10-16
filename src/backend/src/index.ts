import { DropDb } from "./DropDb";
import { DropServer } from "./DropServer";
import * as path from "path";
import { DropFileStore } from "./DropFileStore";
import { IDropStorage } from "./IDropStorage";
import * as dotenv from "dotenv"
dotenv.config()

const dbFile = process.env.DB_FILE
const storeFolder = process.env.STORE_FOLDER
const staticFolder = process.env.STATIC_CONTENT || path.join("..", "frontend")
const port = Number.parseInt(process.env.PORT || "8080")

let db: IDropStorage
if (storeFolder) {
  db = new DropFileStore(storeFolder)
} else if (dbFile) {
  db = new DropDb(dbFile)
} else {
  throw Error("No storage configured")
}
const server = new DropServer(db, { staticFolder, port })
server.startAsync()
