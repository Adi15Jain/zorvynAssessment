const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const { updateUserSchema } = require("../validators/user.validator");
const validate = require("../middleware/validate.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", requireRole("ADMIN"), userController.getAllUsers);
router.get("/:id", requireRole("ADMIN"), userController.getUserById);
router.put(
    "/:id",
    requireRole("ADMIN"),
    validate(updateUserSchema),
    userController.updateUser,
);
router.delete("/:id", requireRole("ADMIN"), userController.deleteUser);

module.exports = router;
