
const Order = require("../models/order");
const User = require("../models/User");
const restaurant = require("../models/restaurant");

// Get all users
exports.getallUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Block or unblock user
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isblocked = !user.isblocked;
    await user.save();

    const safeUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,      message: `User ${
        user.isblocked ? "blocked" : "unblocked"
      } successfully`,
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve or disapprove restaurant
exports.approveRestaurant = async (req, res) => {
  try {
    const Restaurant = await restaurant.findById(req.params.id);

    if (!Restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    Restaurant.isApproved = !Restaurant.isApproved;
    await Restaurant.save();

    res.status(200).json({
      success: true,
      message: `Restaurant ${
        Restaurant.isApproved ? "approved" : "disapproved"
      } successfully`,
      data: Restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("restaurant", "name");

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get fraud suspected orders
exports.getFraudOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      isFraudSuspected: true,
    })
      .populate("user", "name email")
      .populate("restaurant", "name")
      .sort({ fraudRiskScore: -1 });

    res.status(200).json({
      success: true,
      message: "Fraud suspected orders fetched successfully",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get platform statistics
exports.getPlatformStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue:
          totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Approve or Reject Fraud Suspected Order
exports.reviewFraudOrder = async (req, res) => {
  try {
    const { action } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approve or reject",
      });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.isFraudSuspected) {
      return res.status(400).json({
        success: false,
        message: "Order is not flagged as suspicious",
      });
    }

    if (action === "approve") {
      order.isFraudSuspected = false;
      order.requiresAdminReview = false;
      order.fraudReasons = [];
    } else {
      order.orderStatus = "Cancelled";
      order.requiresAdminReview = false;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message:
        action === "approve"
          ? "Fraud order approved successfully"
          : "Fraud order rejected successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
