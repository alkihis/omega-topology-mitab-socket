"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OmegaTopologySocket_1 = __importDefault(require("./OmegaTopologySocket"));
const abort_controller_1 = __importDefault(require("abort-controller"));
const commander_1 = __importDefault(require("commander"));
commander_1.default
    .option('-u, --url <databaseUrl>', 'Database URL', 'http://localhost:3280')
    .option('-p, --port <port>', 'Port', parseInt, 3456)
    .parse(process.argv);
if (typeof window === "undefined" || !window.fetch) {
    var fetch = require("node-fetch");
}
const URL = commander_1.default.url + "/bulk_couple";
const bulk_get = async function* (ids, packet_len = 128) {
    let cache = [];
    const controller = new abort_controller_1.default();
    const timeout = setTimeout(() => { controller.abort(); console.log("Timeout !"); }, 10000 /* 10 secondes */);
    const do_request = async () => {
        // On les récupère
        const partners = await fetch(URL, {
            method: "POST",
            body: JSON.stringify({ keys: cache }),
            headers: { "Content-Type": "application/json" },
            signal: controller.signal
        })
            .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
            .finally(() => {
            clearTimeout(timeout);
        });
        return partners.request;
    };
    // Parcours de l'itérable
    for (const id of ids) {
        if (cache.length >= packet_len) {
            // Le cache est plein, on flush avec do_request
            // On les yield pour les passer à l'itérateur
            try {
                yield await do_request();
            }
            catch (e) {
                console.error(e);
            }
            // On vide le cache
            cache = [];
        }
        // On pousse l'ID actuel dans le cache
        cache.push(id);
    }
    // Si il a encore des éléments en cache (si l'itérateur n'était pas vide), 
    // alors on flush une dernière fois
    if (cache.length) {
        try {
            yield await do_request();
        }
        catch (e) {
            console.error(e);
        }
    }
};
new OmegaTopologySocket_1.default(commander_1.default.port, socket => {
    console.log(`Connected client on port 3456.`);
    socket.on('getlines', async (specie, full_ids) => {
        // Get lines from pairs
        for await (const ids of bulk_get(full_ids)) {
            socket.emit(specie, Object.values(ids));
        }
        socket.emit('terminate');
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
