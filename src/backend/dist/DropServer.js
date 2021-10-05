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
exports.DropServer = void 0;
const Express = require("express");
const uuid_1 = require("uuid");
class DropServer {
    constructor(db, config) {
        this.db = db;
        this.config = config;
        const app = Express();
        app.use(Express.static(config.staticFolder));
        app.use(Express.json());
        app.post("/api/clients", this.createClient.bind(this));
        app.get("/api/clients/:alias", this.getClient.bind(this));
        app.post("/api/clients/:alias/drops", this.createDrop.bind(this));
        app.get("/api/clients/:alias/drops", this.getCompositeDrops.bind(this));
        this.app = app;
    }
    startAsync() {
        return new Promise((resolve) => {
            this.app.listen(this.config.port, () => {
                console.log(`Listening on ${this.config.port}`);
                resolve();
            });
        });
    }
    handleDbError(err, res) {
        if (err.message.indexOf("UNIQUE constraint failed") >= 0) {
            res.statusCode = 409;
            return {
                result: "error",
                error: "Alias already exists"
            };
        }
        else if (err.message.indexOf("not found") >= 0) {
            res.statusCode = 404;
            return {
                result: "error",
                error: err.message
            };
        }
        else {
            console.error(err.message);
            res.statusCode = 500;
            return {
                result: "error",
                error: "Server error"
            };
        }
    }
    createClient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = req.body;
            let response;
            // Todo: validate payload
            try {
                const alias = uuid_1.v4();
                client.alias = alias;
                yield this.db.createClientAsync(client);
                response = {
                    result: "success",
                    data: client
                };
            }
            catch (err) {
                response = this.handleDbError(err, res);
            }
            res.send(response);
        });
    }
    getClient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const alias = req.params["alias"];
            let response;
            try {
                const publicKey = yield this.db.getClientPublicKeyAsync(alias);
                response = {
                    result: "success",
                    data: {
                        alias,
                        publicKey
                    }
                };
            }
            catch (err) {
                response = this.handleDbError(err, res);
            }
            res.send(response);
        });
    }
    createDrop(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const compositeDrop = req.body;
            const toAlias = req.params["alias"];
            let response;
            try {
                const cypher = {
                    contentType: "text/plain",
                    createdDate: new Date(),
                    encryptedText: compositeDrop.encryptedText,
                    id: uuid_1.v4()
                };
                const drop = {
                    cypherId: cypher.id,
                    toAlias: toAlias,
                    encryptedKey: compositeDrop.encryptedKey,
                    fromAlias: compositeDrop.fromAlias,
                    id: uuid_1.v4()
                };
                yield this.db.createCypherAsync(cypher);
                yield this.db.createDropAsync(drop);
                response = {
                    result: "success",
                    data: compositeDrop
                };
            }
            catch (err) {
                response = this.handleDbError(err, res);
            }
            res.send(response);
        });
    }
    getCompositeDrops(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const forAlias = req.params["alias"];
            const passHeader = req.headers.authorization;
            const PASSWORD_TYPE = "Password ";
            const pass = (passHeader && passHeader.startsWith(PASSWORD_TYPE)) ? passHeader.substr(PASSWORD_TYPE.length) : "";
            let response;
            try {
                const res = yield this.db.getDropsAndCyphersAsync(forAlias, pass);
                response = {
                    result: "success",
                    data: res
                };
            }
            catch (err) {
                response = this.handleDbError(err, res);
            }
            res.send(response);
        });
    }
}
exports.DropServer = DropServer;
//# sourceMappingURL=DropServer.js.map