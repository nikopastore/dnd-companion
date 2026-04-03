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

    const fetchSocketToken = async () => {
      const response = await fetch("/api/socket-token", { cache: "no-store" });
      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { token?: string };
      return data.token || null;
    };

    const connectSocket = async () => {
      try {
        const token = await fetchSocketToken();
        if (!token) {
          setConnected(false);
          return;
        }
        if (cancelled) {
          setConnected(false);
          return;
        }

        const socket = getSocket(token);
        socketRef.current = socket;

        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);
        const handleConnectError = async (error: Error) => {
          if (cancelled || !/expired|invalid/i.test(error.message)) return;
          const refreshedToken = await fetchSocketToken();
          if (!refreshedToken || cancelled) return;
          socket.auth = { token: refreshedToken };
          socket.connect();
        };

        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);

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
