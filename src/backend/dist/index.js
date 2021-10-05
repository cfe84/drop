"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DropDb_1 = require("./DropDb");
const DropServer_1 = require("./DropServer");
const dbFile = "testdb.sqlite3";
const staticFolder = "..\\frontend";
const port = Number.parseInt(process.env.PORT || "8080");
const db = new DropDb_1.DropDb(dbFile);
const server = new DropServer_1.DropServer(db, { staticFolder, port });
server.startAsync();
//# sourceMappingURL=index.js.map