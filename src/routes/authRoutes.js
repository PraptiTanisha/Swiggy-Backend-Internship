const express = require('express');
const router = express.Router();
const { register, login, resetRestaurantPassword } = require('../controllers/authController');
router.post('/register', register);
router.post('/login', login);
router.post('/reset-restaurant-password', resetRestaurantPassword);
module.exports = router;