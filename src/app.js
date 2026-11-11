const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoute");
const notificationRoutes = require("./routes/notificationRoutes");
const deliveryPartnerRoutes = require("./routes/deliveryPartnerRoutes");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/admin", require("./routes/AdminRoutes"));
app.use("/api/delivery-partners", deliveryPartnerRoutes);
// Default route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Swiggy API",
  });
});

module.exports = app;
