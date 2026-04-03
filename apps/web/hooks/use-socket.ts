"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    let cancelled = false;

    const connectSocket = async () => {
      try {
        const response = await fetch("/api/socket-token", { cache: "no-store" });
        if (!response.ok) {
          setConnected(false);
          return;
        }

        const data = (await response.json()) as { token?: string };
        if (!data.token || cancelled) {
          setConnected(false);
          return;
        }

        const socket = getSocket(data.token);
        socketRef.current = socket;

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));

        socket.connect();
      } catch {
        setConnected(false);
      }
    };

    void connectSocket();

    return () => {
      cancelled = true;
      disconnectSocket();
      setConnected(false);
    };
  }, [session?.user]);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return { socket: socketRef.current, connected, emit, on };
}
