import OmegaTopologySocket from './OmegaTopologySocket';
import AbortController from 'abort-controller';

if (typeof window === "undefined" || !window.fetch) {
    var fetch = require("node-fetch") as GlobalFetch["fetch"];
}

const URL = "http://localhost:3280/bulk_couple";

const bulk_get = async function* (specie: string, ids: [string, string][], packet_len = 128) {
    let cache = [];

    const controller = new AbortController();
    const timeout = setTimeout(
        () => { controller.abort(); console.log("Timeout !"); },
        10000 /* 10 secondes */
    );

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

        return partners.request as { [id_id2: string]: string[] };
    };

    // Parcours de l'itérable
    for (const id of ids) {
        if (cache.length >= packet_len) {
            // Le cache est plein, on flush avec do_request
            // On les yield pour les passer à l'itérateur
            try {
                yield await do_request();
            } catch (e) {
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
        } catch (e) {
            console.error(e);
        }
    }
};

new OmegaTopologySocket(3456, socket => {
    console.log(`Connected client on port 3456.`);

    socket.on('getlines', async (specie: string, full_ids: [string, string][]) => {
        // Get lines from pairs
        for await (const ids of bulk_get(specie, full_ids)) {
            socket.emit(specie, Object.values(ids) as string[][]);
        }

        socket.emit('terminate');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

