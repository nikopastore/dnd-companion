import type { Server, Socket } from "socket.io";

export function registerCampaignHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;
  const userName = socket.data.userName as string;

  // Join a campaign room
  socket.on("campaign:join", (campaignId: string) => {
    socket.join(`campaign:${campaignId}`);
    console.log(`  ${userName} joined campaign room ${campaignId}`);

    // Notify other members
    socket.to(`campaign:${campaignId}`).emit("campaign:member-joined", {
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  // Leave a campaign room
  socket.on("campaign:leave", (campaignId: string) => {
    socket.leave(`campaign:${campaignId}`);
    console.log(`  ${userName} left campaign room ${campaignId}`);

    socket.to(`campaign:${campaignId}`).emit("campaign:member-left", {
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  // DM broadcasts a message to the campaign
  socket.on("campaign:dm-message", (data: { campaignId: string; message: string }) => {
    io.to(`campaign:${data.campaignId}`).emit("campaign:dm-message", {
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  });

  // Campaign status update (DM starts/pauses session)
  socket.on("campaign:status-update", (data: { campaignId: string; status: string }) => {
    io.to(`campaign:${data.campaignId}`).emit("campaign:status-update", {
      status: data.status,
      timestamp: new Date().toISOString(),
    });
  });
}
