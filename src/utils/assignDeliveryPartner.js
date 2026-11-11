const DeliveryPartner = require("../models/DeliveryPartner");

const assignDeliveryPartner = async (city) => {
  const deliveryPartner = await DeliveryPartner.findOne({
    city: { $regex: city, $options: "i" },
    isAvailable: true,
  }).sort({
    currentOrders: 1,
    rating: -1,
  });

  if (!deliveryPartner) {
    return null;
  }

  deliveryPartner.currentOrders += 1;

  await deliveryPartner.save();

  return deliveryPartner;
};

module.exports = assignDeliveryPartner;
