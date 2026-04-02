const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/summary", analyticsController.getSummary);
router.get("/breakdown", analyticsController.getCategoryBreakdown);
router.get("/trends", analyticsController.getMonthlyTrends);

module.exports = router;
