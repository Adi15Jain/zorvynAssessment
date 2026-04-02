const express = require("express");
const authController = require("../controllers/auth.controller");
const {
    registerSchema,
    loginSchema,
    validate,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
