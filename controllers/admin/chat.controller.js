const Chat = require("../../models/chat.model");
const User = require("../../models/user.model");
const Account = require("../../models/account.model");
const RoomChat = require("../../models/room-chat.model");

//[GET] /admin/chat/support
module.exports.support = async (req, res) => {
    const accountId = res.locals.user.id;
    
    // Lấy tất cả room chat hỗ trợ mà account này tham gia
    const supportRooms = await RoomChat.find({
        typeRoom: "support",
        "users.user_id": accountId,
        deleted: false
    });

    // Lấy thông tin user trong mỗi room
    for (const room of supportRooms) {
        const userIds = room.users
            .filter(user => user.role === "user")
            .map(user => user.user_id);
        
        const users = await User.find({
            _id: { $in: userIds },
            deleted: false
        }).select("fullName avatar");
        
        room.usersInfo = users;
        
        // Lấy tin nhắn cuối cùng
        const lastChat = await Chat.findOne({
            room_chat_id: room.id,
            deleted: false
        }).sort({ createdAt: -1 });
        
        room.lastMessage = lastChat;
    }

    res.render("admin/pages/chat/support", {
        pageTitle: "Hỗ trợ khách hàng",
        supportRooms: supportRooms
    });
}

//[GET] /admin/chat/:roomChatId
module.exports.room = async (req, res) => {
    const roomChatId = req.params.roomChatId;
    const accountId = res.locals.user.id;

    // Kiểm tra account có quyền truy cập room này không
    const room = await RoomChat.findOne({
        _id: roomChatId,
        typeRoom: "support",
        "users.user_id": accountId,
        deleted: false
    });

    if (!room) {
        return res.status(403).render("admin/pages/error/403", {
            pageTitle: "Không có quyền truy cập"
        });
    }

    // Lấy tin nhắn trong room
    const chats = await Chat.find({
        room_chat_id: roomChatId,
        deleted: false
    }).sort({ createdAt: 1 });

    // Lấy thông tin người gửi
    for (const chat of chats) {
        let infoUser = await User.findOne({
            _id: chat.user_id
        }).select("fullName avatar");
        
        if (!infoUser) {
            infoUser = await Account.findOne({
                _id: chat.user_id
            }).select("fullName avatar");
        }
        
        chat.infoUser = infoUser;
    }

    // Lấy thông tin user trong room
    const userIds = room.users
        .filter(user => user.role === "user")
        .map(user => user.user_id);
    
    const users = await User.find({
        _id: { $in: userIds },
        deleted: false
    }).select("fullName avatar");

    res.render("admin/pages/chat/room", {
        pageTitle: "Chat hỗ trợ",
        room: room,
        chats: chats,
        users: users
    });
} 