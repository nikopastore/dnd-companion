import { createServer } from "http";
import { Server } from "socket.io";
import { authMiddleware } from "./middleware/auth";
import { registerCampaignHandlers } from "./handlers/campaign";
import { registerSessionHandlers } from "./handlers/session";

const PORT = parseInt(process.env.SOCKET_PORT || "3001");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Auth middleware
io.use(authMiddleware);

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  const userName = socket.data.userName as string;
  console.log(`⚔️  ${userName} (${userId}) connected`);

  // Join user's personal room for direct messages
  socket.join(`user:${userId}`);

  // Register event handlers
  registerCampaignHandlers(io, socket);
  registerSessionHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`🛡️  ${userName} disconnected`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n🎲 Socket.io server running on port ${PORT}`);
  console.log(`   CORS origin: ${CORS_ORIGIN}\n`);
});
