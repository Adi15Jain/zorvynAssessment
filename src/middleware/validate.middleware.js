const AppError = require("../utils/AppError");

const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (err) {
            const validationErrors = err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }));
            
            const appError = new AppError("Validation Error", 400);
            appError.errors = validationErrors;
            next(appError);
        }
    };
};

module.exports = validate;
