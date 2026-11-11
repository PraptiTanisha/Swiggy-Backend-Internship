const express = require("express");
const router = express.Router();
 
const {
  createRestaurant,
  getMyRestaurant,
  updateRestaurant,
  getAllRestaurants,
  getRecommendedRestaurants,
} = require("../controllers/restaurantController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createRestaurant);
router.get("/my", protect, getMyRestaurant);
router.get("/recommendations", protect, getRecommendedRestaurants);
router.put("/:id", protect, updateRestaurant);
router.get("/", getAllRestaurants);
module.exports = router;
