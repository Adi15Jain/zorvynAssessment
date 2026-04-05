const express = require("express");
const authController = require("../controllers/auth.controller");
const {
    registerSchema,
    loginSchema,
} = require("../validators/auth.validator");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

const { authenticate } = require("../middleware/auth.middleware");

const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);

module.exports = router;
