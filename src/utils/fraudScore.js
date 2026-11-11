const Order = require("../models/order");

const calculateFraudScore = async (userId, orderData) => {
  let riskScore = 0;
  const fraudReasons = [];

  // 1. Rapid orders within 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  const recentOrders = await Order.countDocuments({
    user: userId,
    createdAt: { $gte: tenMinutesAgo },
  });

  if (recentOrders >= 3) {
    riskScore += 30;
    fraudReasons.push("Multiple orders placed within 10 minutes");
  }

  // 2. Repeated cancellations within 24 hours
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  );

  const cancelledOrders = await Order.countDocuments({
    user: userId,
    orderStatus: "Cancelled",
    createdAt: { $gte: twentyFourHoursAgo },
  });

  if (cancelledOrders >= 3) {
    riskScore += 40;
    fraudReasons.push("Repeated order cancellations within 24 hours");
  }

  // 3. Unusually high order amount
  if (orderData.totalAmount > 5000) {
    riskScore += 20;
    fraudReasons.push("Unusually high order amount");
  }

  // 4. Excessive refund requests within 30 days
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  const refundRequests = await Order.countDocuments({
    user: userId,
    refundRequested: true,
    refundRequestedAt: { $gte: thirtyDaysAgo },
  });

  if (refundRequests >= 3) {
    riskScore += 40;
    fraudReasons.push("Excessive refund requests within 30 days");
  }

  // 5. Abnormal coupon usage within 24 hours
  const couponOrders = await Order.countDocuments({
    user: userId,
    couponCode: { $exists: true, $ne: null },
    createdAt: { $gte: twentyFourHoursAgo },
  });

  if (couponOrders >= 5) {
    riskScore += 30;
    fraudReasons.push("Abnormal coupon usage within 24 hours");
  }

  // 6. Unusually high coupon discount
  if (orderData.couponDiscount > 1000) {
    riskScore += 20;
    fraudReasons.push("Unusually high coupon discount");
  }

  return {
    riskScore,
    isFraudSuspected: riskScore >= 50,
    fraudReasons,
    requiresAdminReview: riskScore >= 50,
  };
};

module.exports = {
  calculateFraudScore,
};