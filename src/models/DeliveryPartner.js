const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentOrders: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DeliveryPartner ||
  mongoose.model("DeliveryPartner", deliveryPartnerSchema);
