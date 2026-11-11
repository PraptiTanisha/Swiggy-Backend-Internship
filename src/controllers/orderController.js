const Order = require("../models/order");
const Cart = require("../models/Cart");
const restaurant = require("../models/restaurant");
const calculateSurgePricing = require("../utils/surgePricing");
const { calculateFraudScore } = require("../utils/fraudScore");
const Notification = require("../models/Notification");
const assignDeliveryPartner = require("../utils/assignDeliveryPartner");

// Place Order
exports.placeOrder = async (req, res) => {
  try {
    const { deliveryAddress, couponCode } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.menuItem")
      .populate("restaurant");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    if (!cart.restaurant || !cart.restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not approved",
      });
    }

    // Prepare order items
    const items = cart.items.map((item) => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
    }));

    // Calculate base amount
    const baseAmount = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Calculate surge pricing
    const surgePricing = calculateSurgePricing(baseAmount);

    // Apply demo coupon
    let appliedCoupon = null;
    let couponDiscount = 0;

    if (couponCode === "WELCOME10") {
      appliedCoupon = "WELCOME10";

      couponDiscount = Math.min(
        Math.round(surgePricing.finalAmount * 0.10),
        500
      );
    }

    // Calculate final amount
    const totalAmount = Math.max(
      0,
      surgePricing.finalAmount - couponDiscount
    );

    // Calculate fraud risk score
    const fraudCheck = await calculateFraudScore(req.user._id, {
      totalAmount,
      couponCode: appliedCoupon,
      couponDiscount,
    });

    // Assign delivery partner
    const deliveryPartner = await assignDeliveryPartner(
      cart.restaurant.city
    );

    // Create order
    const order = await Order.create({
      user: req.user._id,
      restaurant: cart.restaurant._id,
      items,
      totalAmount,
      deliveryAddress,

      deliveryPartner: deliveryPartner
        ? deliveryPartner._id
        : null,

      // Surge pricing details
      baseAmount: surgePricing.baseAmount,
      surgePercentage: surgePricing.surgePercentage,
      surgeAmount: surgePricing.surgeAmount,

      // Coupon details
      couponCode: appliedCoupon,
      couponDiscount,

      // Fraud detection details
      fraudRiskScore: fraudCheck.riskScore,
      isFraudSuspected: fraudCheck.isFraudSuspected,
      fraudReasons: fraudCheck.fraudReasons,
      requiresAdminReview: fraudCheck.requiresAdminReview,
    });

    // Clear cart after successful order
    await Cart.findOneAndDelete({
      user: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });

  } catch (error) {
    console.error("Place Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get My Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Get Restaurant Orders
exports.getRestaurantOrders = async (req, res) => {
  try {
    const Restaurant = await restaurant.findOne({
      owner: req.user._id,
    });

    if (!Restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const orders = await Order.find({
      restaurant: Restaurant._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Mock Payment
exports.mockPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this order",
      });
    }

    order.paymentStatus = "Paid";
    order.orderStatus = "Confirmed";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Mock payment successful",
      data: order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Update Order Status and Create Notification
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findById(req.params.id)
      .populate("restaurant");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const Restaurant = await restaurant.findOne({
      owner: req.user._id,
    });

    if (
      !Restaurant ||
      Restaurant._id.toString() !== order.restaurant._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    order.orderStatus = status;
    await order.save();

    // Create customer notification
    await Notification.create({
      user: order.user,
      order: order._id,
      message: `Your order status has been updated to ${status}`,
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated and notification created",
      data: order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    if (
      ["Delivered", "Cancelled", "Out for Delivery"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Request Refund
exports.requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check order ownership
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to request a refund",
      });
    }

    if (order.refundRequested) {
      return res.status(400).json({
        success: false,
        message: "Refund already requested",
      });
    }

    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "Only paid orders are eligible for refund",
      });
    }

    order.refundRequested = true;
    order.refundAmount = order.totalAmount;
    order.refundRequestedAt = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Refund request submitted successfully",
      refundAmount: order.refundAmount,
      refundStatus: "Pending",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Refund request failed",
      error: error.message,
    });
  }
};