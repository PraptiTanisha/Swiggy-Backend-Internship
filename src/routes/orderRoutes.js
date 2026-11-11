const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  placeOrder,
  getMyOrders,
  getRestaurantOrders,
  updateOrderStatus,
  mockPayment,
  cancelOrder,
  requestRefund,
} = require("../controllers/orderController");

router.use(protect);

// User routes
router.post("/", authorize("user"), placeOrder);
router.get("/my", authorize("user"), getMyOrders);
router.post("/verify", authorize("user"), mockPayment);
router.post("/refund/:orderId", authorize("user"), requestRefund);
router.post("/cancel/:orderId", authorize("user"), cancelOrder);
// Restaurant routes
router.get("/restaurant", authorize("restaurant"), getRestaurantOrders);
router.put("/:id/status", authorize("restaurant"), updateOrderStatus);

module.exports = router;