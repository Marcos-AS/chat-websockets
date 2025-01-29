"use strict";
const httpServer = require("./httpserver.js"),
    wsServer = require("./websocket.js");

let server = httpServer.start();
wsServer.start(server);
console.log("Go to: http://localhost:3000/");