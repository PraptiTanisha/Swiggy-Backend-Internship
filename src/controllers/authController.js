const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    return res
      .status(201)
      .json({ success: true, message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.resetRestaurantPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      email: "restaurant@gmail.com",
      role: "restaurant"
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Restaurant owner not found"
      });
    }

    user.password = await bcrypt.hash("Restaurant@123", 10);
    await user.save();

    return res.json({
      success: true,
      message: "Restaurant password reset successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    if (user.isblocked) {
      return res
        .status(403)
        .json({ success: false, message: "User is blocked" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }
    
    const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
    );
    return res
      .status(201)
      .json({ success: true, message: "User logged in successfully", token });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
