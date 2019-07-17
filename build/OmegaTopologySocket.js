"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = require("http");
class OmegaTopologySocket {
    constructor(port = 3456, onconnection) {
        this.port = port;
        // Create app
        this.app = express_1.default();
        // Create server
        this.server = http_1.createServer(this.app);
        // Create socketio
        this.io = socket_io_1.default(this.server);
        // Listen to requests
        this.server.listen(this.port, () => {
            console.log(`Running server on port ${this.port}.`);
        });
        // Set the event handler
        if (onconnection) {
            this.onconnection(onconnection);
        }
    }
    onconnection(callback) {
        this.io.on('connection', callback);
    }
    get express() {
        return this.app;
    }
    get socketio() {
        return this.io;
    }
}
exports.default = OmegaTopologySocket;
