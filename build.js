// Import the HTTP module
const http = require('http');
const port = 8000;

// Create a server object
const server = http.createServer((req, res) => {
    // Set the response HTTP header with HTTP status and Content type
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Send the response body as 'Hello, World!'
    res.end('Hello, World!\n');
});

// Start the server and listen on the specified port
server.listen(port, 'localhost', () => {
    console.log(`Server running at http://localhost:${port}/`);
});