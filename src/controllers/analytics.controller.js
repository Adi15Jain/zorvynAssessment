const analyticsService = require("../services/analytics.service");
const { successResponse } = require("../utils/response");

const getSummary = async (req, res, next) => {
    try {
        const summary = await analyticsService.getSummary(req.user.id);
        return successResponse(res, summary, "Summary retrieved successfully");
    } catch (err) {
        next(err);
    }
};

const getCategoryBreakdown = async (req, res, next) => {
    try {
        const breakdown = await analyticsService.getCategoryBreakdown(
            req.user.id,
        );
        return successResponse(
            res,
            breakdown,
            "Category breakdown retrieved successfully",
        );
    } catch (err) {
        next(err);
    }
};

const getMonthlyTrends = async (req, res, next) => {
    try {
        const trends = await analyticsService.getMonthlyTrends(req.user.id);
        return successResponse(
            res,
            trends,
            "Monthly trends retrieved successfully",
        );
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
};
