const Chat = require("../../models/chat.model");
const Account = require("../../models/account.model");
const uploadToCLoudinary = require("../../helper/uploadImageToCloudinary");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ Admin Socket connected:", socket.id);
    
    socket.on("JOIN_ROOM", (roomId) => {
      socket.join(roomId);
      socket.roomId = roomId;
      console.log(`Admin Socket ${socket.id} joined room ${roomId}`);
    });
    
    socket.on("SET_ADMIN_INFO", (adminInfo) => {
      socket.accountId = adminInfo.accountId;
      socket.accountName = adminInfo.accountName;
      console.log(`👤 Admin info set: ${adminInfo.accountName} (${adminInfo.accountId})`);
    });
    
    socket.on("ADMIN_SEND_MESSAGE", async (data) => {
      try {
        console.log("📨 Received admin message data:", data);
        const { content, images: imageBuffers, roomId } = data;
        const accountId = socket.accountId;
        
        if (!roomId) {
          console.error("❌ No room ID found");
          return;
        }
        
        console.log("💾 Saving admin message to database...");
        const images = [];
        for (const buffer of imageBuffers || []) {
          const link = await uploadToCLoudinary(buffer);
          images.push(link);
        }
        
        const chat = new Chat({
          user_id: accountId,
          room_chat_id: roomId,
          content,
          images,
        });
        await chat.save();
        console.log("✅ Admin message saved to database");
        
        const messageData = {
          accountId,
          fullName: socket.accountName || "Admin",
          content,
          images,
          isAdmin: true
        };
        
        console.log("📤 Broadcasting admin message:", messageData);
        io.to(roomId).emit("SERVER_RETURN_MESSAGE", messageData);
      } catch (err) {
        console.error("❌ Error saving admin message:", err);
      }
    });
    
    socket.on("ADMIN_SEND_TYPING", (type) => {
      const roomId = socket.roomId;
      if (roomId) {
        io.to(roomId).emit("SERVER_RETURN_TYPING", {
          accountId: socket.accountId,
          fullName: socket.accountName,
          type,
          isAdmin: true
        });
      }
    });
  });
}; 