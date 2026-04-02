const express = require("express");
const analyticsController = require("../controllers/analytics.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/summary", analyticsController.getSummary);
router.get("/by-category", analyticsController.getCategoryBreakdown);
router.get("/recent", analyticsController.getRecentRecords);
router.get("/trends", requireRole("ADMIN", "ANALYST"), analyticsController.getMonthlyTrends);

module.exports = router;
