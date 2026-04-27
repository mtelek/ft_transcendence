import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";
import { createPokerServerState } from "./server/poker/state";
import { registerPokerHandlers } from "./server/poker/handlers";

export type { PokerCard, GameSnapshot } from "./server/poker/types";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// APP

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, { cors: { origin: "*" } });
  const state = createPokerServerState();
  registerPokerHandlers(io, state);

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
