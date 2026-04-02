const express = require("express");
const recordController = require("../controllers/record.controller");
const { authenticate, requireRole } = require("../middleware/auth.middleware");
const {
    createRecordSchema,
    updateRecordSchema,
} = require("../validators/record.validator");
const { validate } = require("../validators/auth.validator");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post(
    "/",
    requireRole("ADMIN", "ANALYST"),
    validate(createRecordSchema),
    recordController.createRecord,
);
router.get("/", recordController.getRecords);
router.get("/:id", recordController.getRecordById);
router.put(
    "/:id",
    requireRole("ADMIN"),
    validate(updateRecordSchema),
    recordController.updateRecord,
);
router.delete("/:id", requireRole("ADMIN"), recordController.deleteRecord);

module.exports = router;
