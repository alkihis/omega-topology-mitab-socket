# omega-topology-mitab-socket

> Gives to omega-topology-graph needed MI Tab informations, already stored in CouchDB via omega-topology-service

Fetch MI Tab data from the CouchDB database, behind the request agregator omegalomodb.

> This micro-service use a Socket.io WebSocket connection to interact with the web client

## Installation

```bash
git clone https://github.com/alkihis/omega-topology-mitab-socket.git
cd omega-topology-mitab-socket
npm i
```

## Starting the service
```bash
Usage: node build/index.js [options]

Options:
  -p, --port [portNumber]              Server port number (default: 3289)
  -u, --url [dispatcherUrl]            OmegalomoDB URL (default: "http://localhost:3280")
  -l, --logLevel [logLevel]            Log verbosity (debug, verbose, info, warn, error) (default: "warn")
```

- -p, --port &lt;portNumber&gt; : Port used by the micro-service to listen to request
- -u, --url &lt;dispatcherUrl&gt; : omegalomodb service URL. Default is "http://localhost:3280" (needed to fetch data from Couch)

```bash
# Example
node build/index.js -l debug
```

## WebSocket connection
You must use 2.2+  Socket.io version to connect.

On connection, you must use the `getlines` message to start lines transaction.

### getlines
Get MI Tab lines corresponding to interactors.

#### Arguments
- `specie`: *string* | Arbitary specie name (will be used as response message name)
- `full_ids`: *[string, string][]* | Array of tuples that represents interactors couples

#### Response
Response is sended into multiple messages that hold the name defined in `specie`.

Data contains an array of array of string (`string[][]`).

#### Example

*Client*
```ts
const socket = io();
const specie = "r6";

// Register callback
socket.on(specie, (lines: string[][]) => {
    for (const lines_of_couple of lines) {
        // Lines of couple is an array of string who hold all MI Tab lines of a couple
        // Current couple can be obtain with:
        const first_line = lines_of_couple[0];
        const [interactor_a, interactor_b] = first_line.split('\t').slice(0, 2);

        // Iterating through the lines...
        for (const line of lines_of_couple) {
            // register mitab line into objects...
        }
    }
});

// Ask for lines
socket.emit('getlines', specie, [['Q82742', 'P13482'], ['O24843', 'P14920']]);
```
