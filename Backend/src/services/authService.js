const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

class AuthService {
  // Register new user
  async register(userData) {
    const connection = await pool.getConnection();
    
    try {
      const { name, email, password, user_type = 'traveler' } = userData;
      
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const [result] = await connection.execute(
        `INSERT INTO users (name, email, password, user_type, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [name, email, hashedPassword, user_type]
      );
      
      return {
        id: result.insertId,
        name,
        email,
        user_type
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Login user
  async login(email, password) {
    const connection = await pool.getConnection();
    
    try {
      // Find user
      const [users] = await connection.execute(
        'SELECT id, name, email, password, user_type FROM users WHERE email = ?',
        [email]
      );
      
      if (users.length === 0) {
        throw new Error('Invalid email or password');
      }
      
      const user = users[0];
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type
      };
      
    } finally {
      connection.release();
    }
  }
  
  // Get user by ID
  async getUserById(userId) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.execute(
        `SELECT id, name, email, phone, about_me, city, state, country, 
                languages, gender, profile_picture, user_type, is_verified, 
                created_at, updated_at 
         FROM users WHERE id = ?`,
        [userId]
      );
      
      if (users.length === 0) {
        throw new Error('User not found');
      }
      
      return users[0];
      
    } finally {
      connection.release();
    }
  }
  
  // Update user profile
  async updateProfile(userId, updateData) {
    const connection = await pool.getConnection();
    
    try {
      // Remove sensitive fields
      delete updateData.password;
      delete updateData.user_type;
      delete updateData.is_verified;
      delete updateData.created_at;
      delete updateData.updated_at;
      
      // Build update query
      const updateFields = [];
      const updateValues = [];
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(updateData[key]);
        }
      });
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(userId);
      
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        [...updateValues]
      );
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
  
  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const connection = await pool.getConnection();
    
    try {
      // Get current password hash
      const [users] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update password
      await connection.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, userId]
      );
      
      return { success: true };
      
    } finally {
      connection.release();
    }
  }
}

module.exports = new AuthService();
