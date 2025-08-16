const Chat = require("../../models/chat.model");
const User = require("../../models/user.model");
const Account = require("../../models/account.model");
const chatSocket = require("../../sockets/client/chat.socket");

//[GET] /api/chat/:roomChatId
module.exports.index = async (req, res) => {
  try {
    const roomChatId = req.params.roomChatId;

    //Socket IO
    chatSocket(req, res);
    //End Socket IO

    //Lấy ra data
    const chats = await Chat.find({
      room_chat_id: roomChatId,
      deleted: false
    });
    
    for (const chat of chats) {
      // Kiểm tra xem user_id là user hay account
      let infoUser = await User.findOne({
        _id: chat.user_id
      }).select("fullName");
      
      if (!infoUser) {
        // Nếu không tìm thấy trong User, tìm trong Account
        infoUser = await Account.findOne({
          _id: chat.user_id
        }).select("fullName");
      }
      
      chat.infoUser = infoUser;
    }

    res.json({
      success: true,
      data: {
        chats: chats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};
