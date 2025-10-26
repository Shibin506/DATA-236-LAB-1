const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { requireAuth, requireTraveler } = require('../middleware/requireAuth');
const router = express.Router();

// Add property to favorites (Traveler only)
router.post('/', requireAuth, requireTraveler, favoriteController.addToFavorites.bind(favoriteController));

// Path-style add (compatibility): POST /api/favorites/:property_id
router.post('/:property_id', requireAuth, requireTraveler, (req, res, next) => {
	// Normalize to body-style expected by controller
	req.body = req.body || {}
	req.body.property_id = req.params.property_id
	return favoriteController.addToFavorites(req, res, next)
});

// Get user favorites (Traveler only)
router.get('/traveler/my-favorites', requireAuth, requireTraveler, favoriteController.getUserFavorites.bind(favoriteController));
// Alias to support clients expecting GET /api/favorites
router.get('/', requireAuth, requireTraveler, favoriteController.getUserFavorites.bind(favoriteController));

// Remove property from favorites
router.delete('/:id', requireAuth, requireTraveler, favoriteController.removeFromFavorites.bind(favoriteController));

// Check if property is in favorites
router.get('/check/:property_id', requireAuth, requireTraveler, favoriteController.checkFavoriteStatus.bind(favoriteController));

// Get favorite count for property
router.get('/property/:property_id/count', favoriteController.getPropertyFavoriteCount.bind(favoriteController));

// Get user's favorite count
router.get('/user/count', requireAuth, favoriteController.getUserFavoriteCount.bind(favoriteController));

module.exports = router;
