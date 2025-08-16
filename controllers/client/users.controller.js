const usersSocket = require("../../sockets/client/users.socket");
const User = require("../../models/user.model");



//[GET] /users/not-friend
module.exports.notFriend = async (req,res)=>{
    // Socket
    usersSocket(res);
    // End Socket
    const userId = res.locals.user.id;
    const myUser = await User.findOne({
        _id: userId
    })
    // console.log(userId)
    // console.log(myUser)
    const requestFriends = myUser.requestFriends;
    const acceptFriends = myUser.acceptFriends;
    // console.log(requestFriends);
    // console.log(acceptFriends);
    const users = await User.find({
        $and: [
            {_id: {$nin : requestFriends}},
            {_id: {$nin : acceptFriends}},
            {_id: {$ne: userId},
            
        }],       
        deleted: false,
        status: "active"
    }).select("avatar fullName");
    res.render("client/pages/users/not-friend", {
        pageTitle: "Danh sách người dùng",
        users: users
    });
}

//[GET] /users/not-friend
module.exports.request = async (req,res)=>{
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
  


    res.render("client/pages/users/request",{
        pageTitle: "Request add friend",
        users: users
    })
}

//[GET] /users/accept
module.exports.accept = async (req,res)=>{
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
        res.render("client/pages/users/accept",{
            pageTitle: "Lời mời kết bạn",
            users: users 
        });
    }
    


   
}

//[GET] /users/friend
module.exports.friend = async (req,res)=>{
    const user = await User.findOne({
        _id: res.locals.user.id
    });
    const friendList = user.friendList;
    const friendListId = friendList.map(item=>item.user_id);
    const users = await User.find({
        _id: {$in: friendListId},
        status: "active",
        deleted: false
    }).select("id avatar fullName statusOnline");
    users.forEach((user)=>{
        const infoUser = friendList.find(item=>item.user_id == user.id);
        user.roomChatId = infoUser.room_chat_id;
    })
    res.render("client/pages/users/friend",{
        pageTitle: "Danh sách bạn bè",
        users : users
    });
}