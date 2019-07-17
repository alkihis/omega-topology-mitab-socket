import express from 'express';
import socketio from 'socket.io';
import { createServer, Server } from 'http';

export type SocketIOCallback = (socket: socketio.Socket) => void;

export default class OmegaTopologySocket {
    protected app: express.Application;
    protected server: Server;
    protected io: socketio.Server;

    constructor(protected port = 3456, onconnection?: SocketIOCallback) {
        // Create app
        this.app = express();
        // Create server
        this.server = createServer(this.app);
        // Create socketio
        this.io = socketio(this.server);
        // Listen to requests
        this.server.listen(this.port, () => {
            console.log(`Running server on port ${this.port}.`);
        });

        // Set the event handler
        if (onconnection) {
            this.onconnection(onconnection);
        }
    }

    onconnection(callback: SocketIOCallback) {
        this.io.on('connection', callback);
    }

    get express() {
        return this.app;
    }

    get socketio() {
        return this.io;
    }
}