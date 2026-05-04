import { createServer as createHttpsServer } from "https";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import next from "next";
import { createPokerServerState } from "./server/poker/state";
import { registerPokerHandlers } from "./server/poker/handlers";
import fs from "fs";

export type { PokerCard, GameSnapshot } from "./server/poker/types";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// HTTP server for redirecting to HTTPS (port 80 -> 443)
createHttpServer((req, res) => {
  const host = req.headers.host?.replace(/:3000$/, "") || "localhost";
  res.writeHead(301, { Location: `https://${host}${req.url}` });
  res.end();
}).listen(80, () => {
  console.log("> HTTP server listening on port 80 and redirecting to HTTPS");
});

// APP
app.prepare().then(() => {
  const options = {
    key: fs.readFileSync("/app/certs/key.pem"),
    cert: fs.readFileSync("/app/certs/cert.pem"),
  };
  const httpsServer = createHttpsServer(options, (req, res) => handle(req, res));
  const io = new Server(httpsServer, {
    cors: { origin: "*" },
    destroyUpgrade: false,
  });

  // Let Next.js handle non-socket.io WebSocket upgrades (e.g. HMR)
  const nextUpgradeHandler = app.getUpgradeHandler();
  httpsServer.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith("/socket.io")) {
      nextUpgradeHandler(req, socket, head);
    }
  });

  const state = createPokerServerState();
  registerPokerHandlers(io, state);

  httpsServer.listen(443, () => {
    console.log("> Ready on https://0.0.0.0:443");
  });
});
