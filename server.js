const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Clawdbot WebSocket URL - defaults to localhost for same-server deployment
const CLAWDBOT_URL = process.env.CLAWDBOT_URL || 'ws://localhost:18789';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Create WebSocket server for client connections
    const wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket upgrade requests
    server.on('upgrade', (request, socket, head) => {
        const { pathname } = parse(request.url, true);

        if (pathname === '/api/ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    // Handle WebSocket connections - proxy to Clawdbot
    wss.on('connection', (clientWs) => {
        console.log('Client connected, proxying to Clawdbot at:', CLAWDBOT_URL);

        let clawdbotWs = null;
        let messageQueue = [];
        let isClawdbotConnected = false;

        // Connect to Clawdbot
        try {
            clawdbotWs = new WebSocket(CLAWDBOT_URL);

            clawdbotWs.on('open', () => {
                console.log('Connected to Clawdbot');
                isClawdbotConnected = true;

                // Send any queued messages
                messageQueue.forEach((msg) => {
                    clawdbotWs.send(msg);
                });
                messageQueue = [];
            });

            clawdbotWs.on('message', (data) => {
                // Forward Clawdbot responses to client
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(data.toString());
                }
            });

            clawdbotWs.on('close', () => {
                console.log('Clawdbot connection closed');
                isClawdbotConnected = false;
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.close();
                }
            });

            clawdbotWs.on('error', (err) => {
                console.error('Clawdbot WebSocket error:', err.message);
                if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({ error: 'Failed to connect to Clawdbot' }));
                    clientWs.close();
                }
            });
        } catch (err) {
            console.error('Failed to create Clawdbot connection:', err);
            clientWs.send(JSON.stringify({ error: 'Failed to connect to Clawdbot' }));
            clientWs.close();
        }

        // Forward client messages to Clawdbot
        clientWs.on('message', (message) => {
            const msgString = message.toString();
            if (isClawdbotConnected && clawdbotWs.readyState === WebSocket.OPEN) {
                clawdbotWs.send(msgString);
            } else {
                // Queue message if not yet connected
                messageQueue.push(msgString);
            }
        });

        clientWs.on('close', () => {
            console.log('Client disconnected');
            if (clawdbotWs && clawdbotWs.readyState === WebSocket.OPEN) {
                clawdbotWs.close();
            }
        });

        clientWs.on('error', (err) => {
            console.error('Client WebSocket error:', err.message);
            if (clawdbotWs && clawdbotWs.readyState === WebSocket.OPEN) {
                clawdbotWs.close();
            }
        });
    });

    server.listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Clawdbot proxy endpoint: ws://${hostname}:${port}/api/ws`);
        console.log(`> Clawdbot backend URL: ${CLAWDBOT_URL}`);
    });
});
