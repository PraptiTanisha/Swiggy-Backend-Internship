const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getMyNotifications } = require("../controllers/notificationController");

router.get("/", protect, getMyNotifications);

module.exports = router;