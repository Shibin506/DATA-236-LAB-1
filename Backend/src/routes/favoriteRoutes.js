const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { requireAuth, requireTraveler } = require('../middleware/requireAuth');
const router = express.Router();

// Add property to favorites (Traveler only)
router.post('/', requireAuth, requireTraveler, favoriteController.addToFavorites.bind(favoriteController));

// Get user favorites (Traveler only)
router.get('/traveler/my-favorites', requireAuth, requireTraveler, favoriteController.getUserFavorites.bind(favoriteController));

// Remove property from favorites
router.delete('/:id', requireAuth, requireTraveler, favoriteController.removeFromFavorites.bind(favoriteController));

// Check if property is in favorites
router.get('/check/:property_id', requireAuth, requireTraveler, favoriteController.checkFavoriteStatus.bind(favoriteController));

// Get favorite count for property
router.get('/property/:property_id/count', favoriteController.getPropertyFavoriteCount.bind(favoriteController));

// Get user's favorite count
router.get('/user/count', requireAuth, favoriteController.getUserFavoriteCount.bind(favoriteController));

module.exports = router;
