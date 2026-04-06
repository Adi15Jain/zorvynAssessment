const recordService = require("../services/record.service");
const { successResponse } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

const createRecord = asyncHandler(async (req, res, next) => {
    const record = await recordService.createRecord(req.user, req.body);
    return successResponse(
        res,
        record,
        "Financial record created successfully",
        201,
    );
});

const getRecords = asyncHandler(async (req, res, next) => {
    const result = await recordService.getRecords(req.user, req.query);
    const { records, total, page, limit } = result;
    const totalPages = Math.ceil(total / limit);

    const responseData = {
        records,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };

    return successResponse(
        res,
        responseData,
        "Financial records retrieved successfully",
    );
});

const getRecordById = asyncHandler(async (req, res, next) => {
    const record = await recordService.getRecordById(req.params.id, req.user);
    return successResponse(
        res,
        record,
        "Financial record retrieved successfully",
    );
});

const updateRecord = asyncHandler(async (req, res, next) => {
    const record = await recordService.updateRecord(
        req.params.id,
        req.user,
        req.body,
    );
    return successResponse(
        res,
        record,
        "Financial record updated successfully",
    );
});

const deleteRecord = asyncHandler(async (req, res, next) => {
    await recordService.deleteRecord(req.params.id, req.user);
    return successResponse(res, null, "Financial record deleted successfully");
});

const getDeletedRecords = asyncHandler(async (req, res, next) => {
    const result = await recordService.getDeletedRecords(req.user, req.query);
    const { records, total, page, limit } = result;
    const totalPages = Math.ceil(total / limit);

    const responseData = {
        records,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };

    return successResponse(
        res,
        responseData,
        "Deleted records retrieved successfully",
    );
});

const restoreRecord = asyncHandler(async (req, res, next) => {
    const record = await recordService.restoreRecord(req.params.id);
    return successResponse(
        res,
        record,
        "Financial record restored successfully",
    );
});

module.exports = {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
    getDeletedRecords,
    restoreRecord,
};
