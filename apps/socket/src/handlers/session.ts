import type { Server, Socket } from "socket.io";

export function registerSessionHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId as string;
  const userName = socket.data.userName as string;

  // Character update broadcast — player updates their character, DM sees it live
  socket.on("character:update", (data: {
    campaignId: string;
    characterId: string;
    field: string;
    value: unknown;
    characterName: string;
  }) => {
    // Broadcast to everyone in the campaign except sender
    socket.to(`campaign:${data.campaignId}`).emit("character:updated", {
      userId,
      userName,
      characterId: data.characterId,
      characterName: data.characterName,
      field: data.field,
      value: data.value,
      timestamp: new Date().toISOString(),
    });
  });

  // HP change event (special handling for DM visibility)
  socket.on("character:hp-change", (data: {
    campaignId: string;
    characterId: string;
    characterName: string;
    currentHP: number;
    maxHP: number;
    changeType: "damage" | "heal" | "temp";
    amount: number;
  }) => {
    socket.to(`campaign:${data.campaignId}`).emit("character:hp-changed", {
      ...data,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  // Condition change event
  socket.on("character:condition-change", (data: {
    campaignId: string;
    characterId: string;
    characterName: string;
    condition: string;
    action: "add" | "remove";
  }) => {
    socket.to(`campaign:${data.campaignId}`).emit("character:condition-changed", {
      ...data,
      userName,
      timestamp: new Date().toISOString(),
    });
  });

  // Dice roll broadcast — share rolls with the party
  socket.on("dice:roll", (data: {
    campaignId: string;
    dice: string;
    rolls: number[];
    modifier: number;
    total: number;
    purpose?: string;
  }) => {
    io.to(`campaign:${data.campaignId}`).emit("dice:rolled", {
      ...data,
      userName,
      userId,
      timestamp: new Date().toISOString(),
    });
  });

  // DM reveals/hides session items
  socket.on("session-item:reveal", (data: { campaignId: string; itemId: string; itemName: string }) => {
    socket.to(`campaign:${data.campaignId}`).emit("session-item:revealed", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });
}
