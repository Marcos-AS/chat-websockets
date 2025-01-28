;(function () {
    'use strict';
    
    let ws;

    function onLoad() {
        let localURL = parseLocation(window.location);
        ws = new WebSocket("ws://" + localURL.host, "chat-protocol");
        ws.addEventListener('open', onSocketOpen);
        ws.addEventListener('close', onSocketClose);
        ws.addEventListener('error', onSocketError);
        ws.addEventListener('message', onSocketMessage);
        qs('#chat-send').addEventListener('click', send);
        qs("#chat-input").addEventListener('keyup', onChatInputKeyUp);
    }
    
    function parseLocation(url) {
        let a = document.createElement('a');
        a.href = url;
        return a;
    }
    
    function writeOutput(s) {
        let chatOutput = qs('#chat-output');
        let innerHTML = chatOutput.innerHTML;
        let newOutput = innerHTML===''? s: '<br/>' + s;
        chatOutput.innerHTML = innerHTML + newOutput;
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }
    
    function onSocketError(ev) {
        writeOutput("<i>Connection error.<i>");
    }
    
    function onSocketClose(ev) {
        writeOutput("<i>Connection closed.<i>");
    }
    
    function onSocketOpen(ev) {
        writeOutput("<i>Connection opened.</i>");
    
        sendMessage('chat-join', {
            "username": getChatUsername()
        });
    }
    
    function qs(s) {
        return document.querySelector(s);
    }
    
    function getChatUsername() {
        return qs('#chat-username').value.trim();
    }
    
    function getChatMessage() {
        return qs('#chat-input').value.trim();
    }
    
    
    function sendMessage(type, payload) {
        ws.send(makeMessage(type, payload));
    }
    
    function makeMessage(type, payload) {
        return JSON.stringify({
            'type': type,
            'payload': payload
        })
    }
    
    function onSocketMessage(ev) {
        let message = JSON.parse(ev.data);
        let payload = message.payload;
        let username = escapeHtml(payload.username);
        switch (message.type) {
            case 'chat-message':
                writeOutput('<b>' + username + ':</b> ' + escapeHtml(payload.message)); 
                break;
            case 'chat-join':
                if (username==='') {
                    writeOutput('<i>Someone new has joined the chat.</i>');
                } else {
                    writeOutput('<i><b>' + username + '</b> has joined the chat.</i>');
                }
                break;
            case 'chat-leave':
                writeOutput('<i><b>' + username + '</b> has left the chat.</i>');
        }
    }
    
    function send() {
        sendMessage('chat-message', {
            "username": getChatUsername(),
            "message": getChatMessage()
        });
        qs('#chat-input').value = '';
    }
    
    function onChatInputKeyUp(ev) {
        if (ev.keyCode === 13) {
            send();
        }
    }
    
    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&apos;')
            .replace(/"/g, '&quot;')
            .replace(/\//g, '&sol;');
    }
    
    window.addEventListener('load', onLoad);
}());