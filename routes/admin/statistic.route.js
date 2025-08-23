const express = require('express');
const router = express.Router();
const statisticController = require('../../controllers/admin/statistic.controller');

router.get('/revenue', statisticController.getRevenueStatistic);

module.exports = router;
