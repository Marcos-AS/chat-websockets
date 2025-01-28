const http = require('http'),
    path = require('path'),
    fs = require('fs');   

let baseDir = process.cwd();

function httpHandler(request, response) {
    function onGotFilename(err, filename) {
        function writeError(err) {
            if(err.code == 'ENOENT') {
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.write('404 Not Found\n');
                response.end();
                console.log('404 Not Found ' + filename);
            } else {
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.write('500 Internal Server Error\n');
                response.end();
                console.log("Internal Server Error: " + filename + ": " + err.code);
            }
        }

        if (err) {
            writeError(err);
        } else {
            fs.readFile(filename, "binary", function(err, file) {
                if (err) {
                    writeError(err);
                } else {
                    let mimeType = 'text/plain';
                    import('mime').then((mime) => {
                        const mimeType = mime.default.getType(filename) || 'application/octet-stream';
                        response.writeHead(200, {'Content-Type': mimeType});
                        response.write(file, "binary");
                        response.end();
                        console.log('Sending file ' + filename);
                    });
                }
            });
                    
        }
    }

    let url = new URL(request.url, `http://${request.headers.host}`);
    getFilenameFromPath(url.pathname, onGotFilename);
}


function getFilenameFromPath(filepath, callback) {
    filepath = decodeURI(filepath.replace(/\+/g, '%20'));
    let filename = path.normalize(baseDir + path.sep + filepath);
    let st;

    function onStatComplete(err, stats) {
        if (err) {
            return callback(err, filename);
        }
        if (stats.isDirectory()) {
            filename = path.normalize(filename+path.sep+'index.html');
            fs.stat(filename, onStatComplete);
            return;
        }
        if (stats.isFile()) {
            return callback(null, filename);
        } else {
            return callback(new Error('Unknown file type'), filename);
        }
    }

    if (filename.substring(0, baseDir.length) != baseDir) {
        let err = new Error('Not found');
        err.code = 'ENOENT';
        return callback(err, filename);
    }

    fs.stat(filename, onStatComplete);
}

function startHTTPServer() {
    return http.createServer(httpHandler).listen(3000);
}

exports.start = startHTTPServer;