const websocket = require('websocket');

let connectionList = {};

function startWsServer(httpServer) {
    //se instancia el servidor ws, con un servidor http
    wsServer = new websocket.server({
        httpServer: httpServer
    })
    //la comunicación sucede en 2 etapas, primero request y si acepta, connect
    wsServer.on('request', onServerRequest);
    wsServer.on('connect', onServerConnect);
}

//envía el mensaje en formato JSON a todas las conexiones de la lista
function broadcast(response) {
    for (let k in connectionList) {
        if (connectionList.hasOwnProperty(k)) {
            let destConnection = connectionList[k].connection;
            destConnection.send(JSON.stringify(response));
        }
    }
};

function onClose() {
    let id = getConnectionKey(connection);
    delete connectionList[id];
}

function getConnectionKey(connection) {
    let socket = connection.socket;
    return socket.remoteAddress + ":"+socket.remotePort;    
}

function isWhitelisted(host) {
    // This should contain the URL of the site you're hosting the server
    let whitelist = [
        "localhost",
        "localhost:3000",
    ];

    // Return true if we're in the whitelist
    return whitelist.indexOf(host) != -1;
}

function onServerRequest(request) {
    //puede rechazar la conexión si no está en la whitelist
    if (!isWhitelisted(request.host)) {
        request.reject();
        console.log("Websocket: denying connection from " + request.host);
        return;
    }

    //puede rechazar la conexión si no es el protocolo esperado
    if (request.requestedProtocols[0] != 'chat-protocol') {
        request.reject(400, "Unknown protocol");
        console.log("Websocket: unknown protocol");
        return;
    }

    request.accept('chat-protocol', request.origin);
    console.log("Websocket: accepted connection from " + request.remoteAddress);   
}

function onServerConnect(connection) {
    let k = getConnectionKey(connection);

    connectionList[k] = {
        connection: connection,
    };

    //se le asignan eventos a la conexión
    connection.on('message', onMessage);
    connection.on('error', onError);
    connection.on('close', onClose);
}

function onError(error) {
    console.log("Websocket error: " + this.remoteAddress + ": " + error);
}

function onClose(reason, description) {
    let k = getConnectionKey(this);
    let username = connectionList[k].username;
    delete connectionList[k];
    console.log("Websocket: closed connection to " + this.remoteAddress + ": " + reason + ": " + description);
    let response = {
        'type': 'chat-leave',
        'payload': {
            'username': username
        }
    };
    broadcast(response);
}

//cuando llega un mensaje de un cliente
function onMessage(message) {
    message = JSON.parse(message.utf8Data);
    storeUsername(this,message);
    console.log("Websocket: message: " + this.remoteAddress + ": " + message.type);
    //valida que el tipo en el mensaje sea un tipo conocido
    if (message.type in messageHandler) {
        //llama la función que corresponda
        messageHandler[message.type](message, this);
    } else {
        console.log("Websocket: unknown payload type: " + this.remoteAddress + ": " + message.type);        
    }
}

let messageHandler = {
    "chat-join": function(message) {
        let response = {
            'type': 'chat-join',
            'payload': {
                'username': message.payload.username.trim()
            }
        };
        broadcast(response);
    },
    "chat-message": function(message) {
        let payload = message.payload;
        let text = payload.message.trim();
        if (text==='') {return;}
        let response = {
            'type': 'chat-message',
            'payload': {
                'username': payload.username.trim(),
                'message': text
            }
        }
        broadcast(response);
    }
};



function storeUsername(connection, message) {
    if (message.payload && message.payload.username) {
        let k = getConnectionKey(connection);
        let cleanUsername = message.payload.username.trim();
        connectionList[k].username = cleanUsername;
        
    }
}

exports.start = startWsServer;