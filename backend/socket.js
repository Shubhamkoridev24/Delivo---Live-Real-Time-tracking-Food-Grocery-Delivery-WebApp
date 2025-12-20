// backend/socket.js
import { Server } from "socket.io";

let io;
const onlineUsers = new Map();

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("registerSocket", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("👤 User registered:", userId);
    });

    socket.on("owner-join", (ownerId) => {
      socket.join(`owner_${ownerId}`);
      console.log("🏪 Owner joined room:", ownerId);
    });

    socket.on("user-join", (userId) => {
      socket.join(`user_${userId}`);
      console.log("🙋 User joined room:", userId);
    });

    // ✅ DELIVERY BOY JOIN
    socket.on("deliveryboy-join", (deliveryBoyId) => {
      socket.join(`deliveryBoy_${deliveryBoyId}`);
      console.log("🚚 Delivery boy joined room:", deliveryBoyId);
    });
    
    socket.on("disconnect", () => {
      for (const [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key);
          break;
        } 
      }
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};
