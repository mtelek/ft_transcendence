import { createServer } from "http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const activeSocketIds = new Set<string>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    activeSocketIds.add(socket.id);
    console.log("[Socket.io] User connected:", socket.id);

    socket.on("message", (data: { username: string; text: string }) => {
      io.emit("message", data);
    });

    socket.on("disconnect", (reason) => {
      activeSocketIds.delete(socket.id);
      console.log("[Socket.io] User disconnected:", socket.id, "Reason:", reason);
      console.log("[Socket.io] Active sockets:", activeSocketIds.size);
    });
  });

  httpServer.listen(3000, () => {
    console.log("> Ready on http://localhost:3000");
  });
});
