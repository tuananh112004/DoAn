const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/order.controller');

router.get('/', orderController.list);
router.get('/:id', orderController.detail);
router.post('/:id/confirm', orderController.confirm);

module.exports = router;
