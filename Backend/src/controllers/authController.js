const authService = require('../services/authService');

class AuthController {
  // Register user
  async register(req, res) {
    try {
      const { name, email, password, user_type = 'traveler' } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }
      
      const user = await authService.register({ name, email, password, user_type });
      
      // Create session
      req.session.userId = user.id;
      req.session.userType = user.user_type;
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }
      
      const user = await authService.login(email, password);
      
      // Create session
      req.session.userId = user.id;
      req.session.userType = user.user_type;
      
      res.json({
        success: true,
        message: 'Login successful',
        data: { user }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Logout user
  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({
            success: false,
            message: 'Logout failed'
          });
        }
        res.clearCookie('airbnb.session');
        res.json({
          success: true,
          message: 'Logout successful'
        });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
  
  // Get current user
  async getCurrentUser(req, res) {
    try {
      const user = await authService.getUserById(req.userId);
      
      res.json({
        success: true,
        data: { user }
      });
      
    } catch (error) {
      console.error('Get user error:', error);
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Update user profile
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      
      // Users can only update their own profile
      if (parseInt(id) !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own profile'
        });
      }
      
      await authService.updateProfile(req.userId, req.body);
      
      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
      
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Change password
  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { current_password, new_password } = req.body;
      
      // Users can only change their own password
      if (parseInt(id) !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only change your own password'
        });
      }
      
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }
      
      await authService.changePassword(req.userId, current_password, new_password);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
      
    } catch (error) {
      console.error('Change password error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();
