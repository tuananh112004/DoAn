const Chat = require("../../models/chat.model");   
const User = require("../../models/user.model");
const Account = require("../../models/account.model");
const uploadToCLoudinary = require("../../helper/uploadImageToCloudinary");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("JOIN_ROOM", (roomId) => {
      socket.join(roomId);
      socket.roomId = roomId;
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    socket.on("CLIENT_SEND_MESSAGE", async (data) => {
      try {
        console.log("📨 Received message data:", data);
        const { content, images: imageBuffers } = data;
        const roomChatId = socket.roomId;
        
        // Lấy user ID từ socket hoặc từ data
        const userId = socket.userId || data.userId;
        
        if (!roomChatId) {
          console.error("❌ No room ID found");
          return;
        }

        console.log("💾 Saving message to database...");
        const images = [];
        for (const buffer of imageBuffers || []) {
          const link = await uploadToCLoudinary(buffer);
          images.push(link);
        }

        const chat = new Chat({
          user_id: userId,
          room_chat_id: roomChatId,
          content,
          images,
        });
        await chat.save();
        console.log("✅ Message saved to database");

        // Tìm thông tin người gửi
        let senderInfo = await User.findById(userId).select("fullName");
        if (!senderInfo) {
          senderInfo = await Account.findById(userId).select("fullName");
        }

        const messageData = {
          userId,
          fullName: senderInfo?.fullName || "Unknown User",
          content,
          images,
        };

        console.log("📤 Broadcasting message:", messageData);
        io.to(roomChatId).emit("SERVER_RETURN_MESSAGE", messageData);
      } catch (err) {
        console.error("❌ Error saving message:", err);
      }
    });

    socket.on("CLIENT_SEND_TYPING", (type) => {
      const roomChatId = socket.roomId;
      if (roomChatId) {
        io.to(roomChatId).emit("SERVER_RETURN_TYPING", {
          userId: socket.userId,
          fullName: socket.fullName,
          type,
        });
      }
    });

    // Lưu thông tin user khi kết nối
    socket.on("SET_USER_INFO", (userInfo) => {
      socket.userId = userInfo.userId;
      socket.fullName = userInfo.fullName;
      console.log(`👤 User info set: ${userInfo.fullName} (${userInfo.userId})`);
    });
  });
};
