const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // User Information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Restaurant Information
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    // Delivery Partner
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPartner",
      default: null,
    },

    // Order Items
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
        },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    // Order Amount
    totalAmount: {
      type: Number,
      required: true,
    },

    // Coupon Tracking for Fraud Detection
    couponCode: {
      type: String,
      default: null,
    },

    couponDiscount: {
      type: Number,
      default: 0,
    },

    // Refund Tracking for Fraud Detection
    refundRequested: {
      type: Boolean,
      default: false,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundRequestedAt: {
      type: Date,
      default: null,
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    // Order Status
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    // Delivery Address
    deliveryAddress: {
      type: String,
      required: true,
    },

    // Dynamic Surge Pricing Fields
    baseAmount: {
      type: Number,
      default: 0,
    },

    surgePercentage: {
      type: Number,
      default: 0,
    },

    surgeAmount: {
      type: Number,
      default: 0,
    },

    // Fraud Detection Fields
    fraudRiskScore: {
      type: Number,
      default: 0,
    },

    isFraudSuspected: {
      type: Boolean,
      default: false,
    },

    fraudReasons: {
      type: [String],
      default: [],
    },

    requiresAdminReview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);
