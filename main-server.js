"use strict";
const httpServer = require("./server.js"),
    wsServer = require("./websocket.js");

let server = httpServer.start();
wsServer.start(server);
console.log("Go to: http://localhost:3000/hola.html");