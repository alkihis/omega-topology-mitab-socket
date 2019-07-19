import OmegaTopologySocket from './OmegaTopologySocket';
import AbortController from 'abort-controller';
import commander from 'commander';
import logger from './logger';

commander
    .option('-u, --url <databaseUrl>', 'Database URL', 'http://localhost:3280')
    .option('-p, --port <port>', 'Port', parseInt, 3456)
    .option('-l, --logLevel [logLevel]', 'Log level [debug|verbose|info|warn|error]', /^(debug|verbose|info|warn|error)$/, 'warn')
.parse(process.argv)

logger.level = commander.logLevel;

if (typeof window === "undefined" || !window.fetch) {
    var fetch = require("node-fetch") as GlobalFetch["fetch"];
}

const URL = commander.url + "/bulk_couple";
logger.info(`Will fetch MI Tab data from ${URL}`);

const bulk_get = async function* (ids: [string, string][], packet_len = 128) {
    let cache = [];

    const controller = new AbortController();
    const timeout = setTimeout(
        () => { controller.abort(); logger.info("Timeout !"); },
        10000 /* 10 secondes */
    );

    const do_request = async () => {
        logger.debug(`Fetching ${cache.length} couples from Couch`);

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
                logger.error(e);
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
            logger.error(e);
        }
    }
};

new OmegaTopologySocket(commander.port, socket => {
    logger.info(`Connected client ${socket.id} on port 3456.`);

    socket.on('getlines', async (specie: string, full_ids: [string, string][]) => {
        logger.debug(`Requested ${full_ids.length} couples from client ${socket.id}`);

        // Get lines from pairs
        for await (const ids of bulk_get(full_ids)) {
            socket.emit(specie, Object.values(ids) as string[][]);
        }

        socket.emit('terminate');
    });

    socket.on('disconnect', () => {
        logger.info('Client disconnected');
    });
});

