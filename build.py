import http.server;
import socketserver;
import json;

PORT = 8001;

TO_BUILD = json.loads(open("buildTools/extensions.json", "rt").read());

#Now here is where the fun begins
class myHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        for i in TO_BUILD:
            print("/extensions/" + i);
            if (self.path.startswith("/extensions/" + i) and self.path.endswith("extension.js")):
                self.path;
        super().do_GET();
        print("path is ", self.path);
        pass;

httpServ = socketserver.TCPServer(("", PORT), myHandler);
print("serving at port", PORT);

try:
    httpServ.serve_forever()
except KeyboardInterrupt:
    pass;

print("Stopping");
httpServ.shutdown();
pass;