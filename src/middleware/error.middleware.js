const { errorResponse } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    
    // Prisma specific errors
    if (err.code === 'P2002') {
        err.statusCode = 409;
        err.message = 'Duplicate field value entered';
    } else if (err.code === 'P2025') {
        err.statusCode = 404;
        err.message = 'Record not found';
    }

    // Zod validation errors (if passing array of errors)
    const errors = err.errors || [];

    // Send unified response
    return errorResponse(res, err.message, err.statusCode, errors);
};

module.exports = errorHandler;
