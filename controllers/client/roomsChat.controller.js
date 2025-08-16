const User = require("../../models/user.model");
const Account = require("../../models/account.model");
const RoomChat = require("../../models/room-chat.model");

//[GET] /rooms-chat
module.exports.index = async (req,res)=>{
    const userId = res.locals.user.id;
    
    // Tìm room chat hỗ trợ của user này
    let supportRoom = await RoomChat.findOne({
        typeRoom: "support",
        "users.user_id": userId,
        deleted: false
    });

    // Nếu chưa có room chat hỗ trợ, tạo mới
    if (!supportRoom) {
        // Lấy tất cả account (admin) active
        const accounts = await Account.find({
            status: "active",
            deleted: false
        });

        const dataChat = {
            title: "Hỗ trợ khách hàng",
            typeRoom: "support",
            users: []
        };

        // Thêm user vào room
        dataChat.users.push({
            user_id: userId,
            role: "user"
        });

        // Thêm tất cả account vào room
        accounts.forEach(account => {
            dataChat.users.push({
                user_id: account.id,
                role: "admin"
            });
        });

        supportRoom = new RoomChat(dataChat);
        await supportRoom.save();
    }

    // Lấy thông tin accounts trong room
    const accountIds = supportRoom.users
        .filter(user => user.role === "admin")
        .map(user => user.user_id);
    
    const accounts = await Account.find({
        _id: { $in: accountIds },
        deleted: false
    }).select("fullName avatar");

    res.render("client/pages/rooms-chat/index", {
        pageTitle: "Hỗ trợ khách hàng",
        supportRoom: supportRoom,
        accounts: accounts
    });
}

//[GET] /rooms-chat/create
module.exports.create = async (req,res)=>{
    // Chuyển hướng về trang hỗ trợ chính
    res.redirect("/rooms-chat");
}

//[POST] /rooms-chat/create
module.exports.createPost = async (req,res)=>{
    // Chuyển hướng về trang hỗ trợ chính
    res.redirect("/rooms-chat");
}