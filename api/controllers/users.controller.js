const usersSocket = require("../../sockets/client/users.socket");
const User = require("../../models/user.model");

//[GET] /api/users/not-friend
module.exports.notFriend = async (req, res) => {
  try {
    // Socket
    usersSocket(res);
    // End Socket
    const userId = res.locals.user.id;
    const myUser = await User.findOne({
      _id: userId
    });
    
    const requestFriends = myUser.requestFriends;
    const acceptFriends = myUser.acceptFriends;
    
    const users = await User.find({
      $and: [
        {_id: {$nin : requestFriends}},
        {_id: {$nin : acceptFriends}},
        {_id: {$ne: userId}},
      ],       
      deleted: false,
      status: "active"
    }).select("avatar fullName");
    
    res.json({
      success: true,
      data: {
        users: users
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

//[GET] /api/users/request
module.exports.request = async (req, res) => {
  try {
    // Socket
    usersSocket(res);
    // End Socket
    const myUserId = res.locals.user.id;
    const myUser = await User.findOne({
      _id: myUserId
    });
    const requestFriends = myUser.requestFriends;

    const users = await User.find({
      _id: { $in: requestFriends },
      status: "active",
      deleted: false
    }).select("id avatar fullName");

    res.json({
      success: true,
      data: {
        users: users
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

//[GET] /api/users/accept
module.exports.accept = async (req, res) => {
  try {
    const userId = res.locals.user.id;
    // Socket
    usersSocket(res);
    // End Socket
    const myUser = await User.findOne({
      _id: userId
    });
    
    if(myUser){
      const acceptFriends = myUser.acceptFriends;
      const users = await User.find({
        _id: {$in: acceptFriends},
        status: "active",
        deleted: false
      }).select("id avatar fullName");
      
      res.json({
        success: true,
        data: {
          users: users
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message
    });
  }
};

//[GET] /api/users/friend
module.exports.friend = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: res.locals.user.id
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }
    
    const friendList = user.friendList;
    const friendListId = friendList.map(item => item.user_id);
    const users = await User.find({
      _id: {$in: friendListId},
      status: "active",
      deleted: false
    }).select("id avatar fullName statusOnline");
    
    users.forEach((user) => {
      const infoUser = friendList.find(item => item.user_id == user.id);
      user.roomChatId = infoUser.room_chat_id;
    });
    
    res.json({
      success: true,
      data: {
        users: users
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
