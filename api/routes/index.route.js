const express = require('express');
const router = express.Router();

// Import các route
const homeRoute = require('./home.route');
const productRoute = require('./product.route');
const cartRoute = require('./cart.route');
const userRoute = require('./user.route');
const checkoutRoute = require('./checkout.route');
const commentRoute = require('./comment.route');
const searchRoute = require('./search.route');
const chatRoute = require('./chat.route');
const usersRoute = require('./users.route');
const roomsChatRoute = require('./roomsChat.route');
const cartMiddleware = require('../../middlewares/client/cart.middleware');

// Định nghĩa các route
// Đảm bảo luôn có cookie cartId cho các request API (phục vụ React client)
router.use(cartMiddleware.cartId);
router.use('/home', homeRoute);
router.use('/products', productRoute);
router.use('/cart', cartRoute);
router.use('/user', userRoute);
router.use('/checkout', checkoutRoute);
router.use('/comments', commentRoute);
router.use('/search', searchRoute);
router.use('/chat', chatRoute);
router.use('/users', usersRoute);
router.use('/rooms-chat', roomsChatRoute);

module.exports = router;
