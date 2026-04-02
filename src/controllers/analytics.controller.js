const analyticsService = require("../services/analytics.service");
const { successResponse } = require("../utils/response");

const getSummary = async (req, res, next) => {
    try {
        const summary = await analyticsService.getSummary(req.user.id, req.query);
        return successResponse(res, summary, "Summary retrieved successfully");
    } catch (err) {
        next(err);
    }
};

const getCategoryBreakdown = async (req, res, next) => {
    try {
        const breakdown = await analyticsService.getCategoryBreakdown(
            req.user.id,
            req.query,
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
        const trends = await analyticsService.getMonthlyTrends(req.user.id, req.query);
        return successResponse(
            res,
            trends,
            "Monthly trends retrieved successfully",
        );
    } catch (err) {
        next(err);
    }
};

const getRecentRecords = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const recent = await analyticsService.getRecentRecords(req.user.id, limit);
        return successResponse(
            res,
            recent,
            "Recent records retrieved successfully",
        );
    } catch (err) {
        next(err);
    }
};


module.exports = {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentRecords,
};
