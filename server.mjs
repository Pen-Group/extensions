import * as http from "http";
import * as fs from "fs";
import * as readlineLib from "readline";

const readline = readlineLib.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const port = 8000;

//MIME types for various things
const extensionToType = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    gif: "image/gif",
    bmp: "image/bmp",
    apng: "image/apng",
    avif: "image/avif",
    ico: "image/vnd.microsoft.icon",
    png: "image/png",
    tif: "image/tiff",
    tiff: "image/tiff",
    webp: "image/webp",
    svg: "image/svg+xml",

    js: "text/javascript",
    css: "text/css",
    json: "application/json",
    zip: "application/zip",

    htm: "text/html",
    html: "text/html",

    aac: "audio/aac",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    opus: "audio/ogg",
    wav: "audio/wav",

    mp4: "video/mp4",
    webm: "video/webm",
};

//Get extensions
const possibleExtensions = ["simple http server"];

const extensionList = JSON.parse(fs.readFileSync("buildTools/extensions.json"));
for (let extID in extensionList) {
    const extension = extensionList[extID];
    if (typeof extension == "string") possibleExtensions.push(extension);
}

//Print the result and define some functions we need
console.log(`\x1b[36m What do you want to work on?`);
for (let extID in possibleExtensions) {
    const stringVer = extID.toString(36);
    if (extID == 0) console.log(`\x1b[32m${stringVer}: ${possibleExtensions[extID]}`);
    else console.log(`\x1b[35m${stringVer}: ${possibleExtensions[extID]}`);
}

function runServer(startingPath) {
    // Create a server object
    const server = http.createServer(({ url }, res) => {
        //If we don't have a file get index.html
        if (!url.match(/\/[\w\d\s.]+/)) url += "index.html";

        //Replace the first /
        url = url.replace("/", "");

        let fullPath = startingPath + url;

        //If we are getting the extension for something we need to build build it, otherwise just return the base object
        if (startingPath && url == "/extension.js") {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
        }
        else if (fs.existsSync(fullPath)) {
            //Get the file extension
            let fileExtension = url.split(".");
            fileExtension = fileExtension[fileExtension.length - 1];

            fs.readFile(fullPath, null, (err, data) => {
                //Return the base file;
                res.writeHead(200, { 'Content-Type': extensionToType[fileExtension] || "text/plain" });
                res.end(data, "binary");
            });
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end("404 not found");
        }

        // Send the response body as 'Hello, World!'
    });

    // Start the server and listen on the specified port
    server.listen(port, 'localhost', () => {
        console.log(`\x1b[34mServer running at "http://localhost:${port}/" starting from "./${startingPath}"`);
    });
}

//Ask the question, and ask again if invalid, or clamp if valid;
function question() {
    readline.question("", (input) => {
        let result = Number(input);

        if (isNaN(result)) question();
        else {
            result = Math.max(0, Math.min(result, possibleExtensions.length - 1));
            if (result == 0) runServer("");
            else runServer(`extensions/${possibleExtensions[result]}/`);
        }
    })
}

//Then start asking
question();