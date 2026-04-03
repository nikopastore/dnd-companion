import type { Server, Socket } from "socket.io";

export function registerEncounterHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;
  const userName = socket.data.userName as string;

  socket.on(
    "encounter:update",
    (data: {
      campaignId: string;
      encounterId: string;
      encounterName: string;
      status: string;
      liveState: unknown;
    }) => {
      io.to(`campaign:${data.campaignId}`).emit("encounter:updated", {
        ...data,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      });
    }
  );

  socket.on(
    "location:map-updated",
    (data: {
      campaignId: string;
      locationId: string;
      location: unknown;
    }) => {
      io.to(`campaign:${data.campaignId}`).emit("location:map-updated", {
        ...data,
        userId,
        userName,
        timestamp: new Date().toISOString(),
      });
    }
  );
}
