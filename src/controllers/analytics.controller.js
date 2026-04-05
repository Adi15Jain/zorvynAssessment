const analyticsService = require("../services/analytics.service");
const { successResponse } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const getSummary = asyncHandler(async (req, res, next) => {
    const summary = await analyticsService.getSummary(req.user.id, req.query);
    return successResponse(res, summary, "Summary retrieved successfully");
});

const getCategoryBreakdown = asyncHandler(async (req, res, next) => {
    const breakdown = await analyticsService.getCategoryBreakdown(
        req.user.id,
        req.query,
    );
    return successResponse(
        res,
        breakdown,
        "Category breakdown retrieved successfully",
    );
});

const getMonthlyTrends = asyncHandler(async (req, res, next) => {
    const trends = await analyticsService.getMonthlyTrends(req.user.id, req.query);
    return successResponse(
        res,
        trends,
        "Monthly trends retrieved successfully",
    );
});

const getRecentRecords = asyncHandler(async (req, res, next) => {
    const { limit } = req.query;
    const recent = await analyticsService.getRecentRecords(req.user.id, limit);
    return successResponse(
        res,
        recent,
        "Recent records retrieved successfully",
    );
});

module.exports = {
    getSummary,
    getCategoryBreakdown,
    getMonthlyTrends,
    getRecentRecords,
};
