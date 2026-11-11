const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const DeliveryPartner = require("../models/DeliveryPartner");

router.use(protect);
router.use(authorize("admin"));

// Register Delivery Partner
router.post("/", async (req, res) => {
  try {
    const deliveryPartner = await DeliveryPartner.create(req.body);

    res.status(201).json({
      success: true,
      message: "Delivery partner created successfully",
      data: deliveryPartner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
