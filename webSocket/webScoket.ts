import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

let socket: Socket | null = null;

export const connectSocket = async () => {
  console.log("webSocket run");

  if (socket && socket.connected) return; // prevent duplicate connections

  const token = await AsyncStorage.getItem("userToken");
  console.log("Token:", token);
  if (!token) return;

  socket = io("http://192.168.1.10:5000", {
    auth: { token },
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("userOnline", (data: { userId: string }) => {
    console.log("User online:", data.userId);
  });

  socket.on("userOffline", (data: { userId: string }) => {
    console.log("User offline:", data.userId);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    // console.error("Socket connect error:", err.message);
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
