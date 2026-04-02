const recordService = require("../services/record.service");
const { successResponse, errorResponse } = require("../utils/response");

const createRecord = async (req, res, next) => {
    try {
        const record = await recordService.createRecord(req.user.id, req.body);
        return successResponse(
            res,
            record,
            "Financial record created successfully",
            201,
        );
    } catch (err) {
        next(err);
    }
};

const getRecords = async (req, res, next) => {
    try {
        const records = await recordService.getRecords(req.user.id, req.query);
        return successResponse(
            res,
            records,
            "Financial records retrieved successfully",
        );
    } catch (err) {
        next(err);
    }
};

const getRecordById = async (req, res, next) => {
    try {
        const record = await recordService.getRecordById(
            req.params.id,
            req.user.id,
        );
        return successResponse(
            res,
            record,
            "Financial record retrieved successfully",
        );
    } catch (err) {
        next(err);
    }
};

const updateRecord = async (req, res, next) => {
    try {
        const record = await recordService.updateRecord(
            req.params.id,
            req.user.id,
            req.body,
        );
        return successResponse(
            res,
            record,
            "Financial record updated successfully",
        );
    } catch (err) {
        next(err);
    }
};

const deleteRecord = async (req, res, next) => {
    try {
        await recordService.deleteRecord(req.params.id, req.user.id);
        return successResponse(
            res,
            null,
            "Financial record deleted successfully",
        );
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRecord,
    getRecords,
    getRecordById,
    updateRecord,
    deleteRecord,
};
