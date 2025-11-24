const bcrypt = require('bcryptjs');
const { User } = require('../models');

class AuthService {
  // Register new user
  async register(userData) {
    const { name, email, password, user_type = 'traveler' } = userData;
    
    // Check if user already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate next _id
    const lastUser = await User.findOne().sort({ _id: -1 }).limit(1);
    const nextId = lastUser && typeof lastUser._id === 'number' ? lastUser._id + 1 : 7;
    
    // Create user
    const user = await User.create({
      _id: nextId,
      name,
      email,
      password: hashedPassword,
      user_type
    });
    
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      role: user.user_type  // Add role for backward compatibility
    };
  }
  
  // Login user
  async login(email, password) {
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      role: user.user_type,  // Add role for backward compatibility
      phone: user.phone,
      profile_picture_url: user.profile_picture_url
    };
  }
  
  // Get user by ID
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  // Update user profile
  async updateProfile(userId, updateData) {
    // Remove sensitive fields
    delete updateData.password;
    delete updateData.user_type;
    delete updateData.role;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return { success: true, user };
  }
  
  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return { success: true };
  }
}

module.exports = new AuthService();
