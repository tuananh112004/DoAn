const RoomChat = require("../../models/room-chat.model");

module.exports.isAccess = async (req, res, next) => {
   const userId = res.locals.user.id;
   const roomChatId = req.params.roomChatId;
   
   try {
    const isAccessRoom = await RoomChat.findOne({
        _id: roomChatId,
        "users.user_id": userId,
        deleted: false
    });
    console.log(isAccessRoom);
    if(isAccessRoom){
        next();
    }
    else{
        res.redirect("/");
    }
   } catch (error) {
    res.redirect("/");
   }

    



    
}