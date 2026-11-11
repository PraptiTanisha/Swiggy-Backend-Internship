const Restaurant = require("../models/restaurant");
const Order = require("../models/order");

// Create Restaurant
exports.createRestaurant = async (req, res) => {
  try {
    if (req.user.role !== "restaurant") {
      return res.status(403).json({
        success: false,
        message: "Only restaurant owners can create restaurants",
      });
    }

    const existingRestaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: "You already have a restaurant registered",
      });
    }

    const createdRestaurant = await Restaurant.create({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: createdRestaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating restaurant",
      error: error.message,
    });
  }
};

// Get My Restaurant
exports.getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "You don't have a restaurant registered",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restaurant",
      error: error.message,
    });
  }
};

// Update Restaurant
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({
      owner: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "You don't have a restaurant registered",
      });
    }

    const allowedFields = [
      "name",
      "city",
      "address",
      "image",
      "cuisine",
      "priceRange",
      "deliveryTime",
      "isVeg",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: updatedRestaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating restaurant",
      error: error.message,
    });
  }
};

// Get All Approved Restaurants with Advanced Filters
exports.getAllRestaurants = async (req, res) => {
  try {
    const {
      city,
      search,
      cuisine,
      minRating,
      minPrice,
      maxPrice,
      maxDeliveryTime,
      isVeg,
      sortBy = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination values",
      });
    }

    const query = { isApproved: true };

    if (city) {
      query.city = { $regex: city, $options: "i" };
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (cuisine) {
      query.cuisine = {
        $regex: cuisine,
        $options: "i",
      };
    }

    if (minRating !== undefined) {
      const rating = Number(minRating);

      if (Number.isNaN(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 0 and 5",
        });
      }

      query.rating = { $gte: rating };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.priceRange = {};

      if (minPrice !== undefined) {
        query.priceRange.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        query.priceRange.$lte = Number(maxPrice);
      }
    }

    if (maxDeliveryTime !== undefined) {
      query.deliveryTime = {
        $lte: Number(maxDeliveryTime),
      };
    }

    if (isVeg !== undefined) {
      if (!["true", "false"].includes(isVeg)) {
        return res.status(400).json({
          success: false,
          message: "isVeg must be true or false",
        });
      }

      query.isVeg = isVeg === "true";
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      rating: { rating: -1 },
      priceLow: { priceRange: 1 },
      priceHigh: { priceRange: -1 },
      fastest: { deliveryTime: 1 },
      popular: { totalOrders: -1 },
    };

    if (!sortOptions[sortBy]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sortBy value",
      });
    }

    const restaurants = await Restaurant.find(query)
      .sort(sortOptions[sortBy])
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    const total = await Restaurant.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      filtersApplied: {
        city,
        search,
        cuisine,
        minRating,
        minPrice,
        maxPrice,
        maxDeliveryTime,
        isVeg,
        sortBy,
      },
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restaurants",
      error: error.message,
    });
  }
};

// Dynamic Restaurant Recommendations
exports.getRecommendedRestaurants = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      orderStatus: { $ne: "Cancelled" },
    }).select("restaurant");

    const restaurantCounts = {};

    orders.forEach((order) => {
      const restaurantId = order.restaurant.toString();

      restaurantCounts[restaurantId] =
        (restaurantCounts[restaurantId] || 0) + 1;
    });

    const restaurants = await Restaurant.find({
      isApproved: true,
    });

    restaurants.sort((a, b) => {
      const countA = restaurantCounts[a._id.toString()] || 0;
      const countB = restaurantCounts[b._id.toString()] || 0;

      if (countA !== countB) {
        return countB - countA;
      }

      return (b.rating || 0) - (a.rating || 0);
    });

    res.status(200).json({
      success: true,
      message: "Recommended restaurants fetched successfully",
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recommended restaurants",
      error: error.message,
    });
  }
};
