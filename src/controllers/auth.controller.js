const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const env = require('../config/env');
const { addToBlocklist } = require('../middleware/auth');
const {
  ValidationError,
  AuthError,
  ConflictError,
  BadRequestError
} = require('../middleware/errorHandler');

async function register(req, res, next) {
  try {
    const { email, mobile, password, companyName, ownerName, deliveryAddress, gstNumber } = req.body;
    
    if (!email && !mobile) {
      throw new BadRequestError('Either email or mobile is required');
    }
    
    if (!password || password.length < 8) {
      throw new BadRequestError('Password must be at least 8 characters long');
    }
    
    if (!companyName || !ownerName || !deliveryAddress || !gstNumber) {
      throw new BadRequestError('All customer profile fields are required');
    }
    
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR mobile = $2',
      [email || null, mobile || null]
    );
    
    if (existingUser.rows.length > 0) {
      throw new ConflictError('Email or mobile already registered');
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    
    await pool.query('BEGIN');
    
    try {
      const userInsert = await pool.query(
        'INSERT INTO users (id, email, mobile, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, mobile, role',
        [userId, email || null, mobile || null, passwordHash, 'CUSTOMER']
      );
      
      await pool.query(
        'INSERT INTO customer_profiles (user_id, company_name, owner_name, delivery_address, gst_number) VALUES ($1, $2, $3, $4, $5)',
        [userId, companyName, ownerName, deliveryAddress, gstNumber]
      );
      
      await pool.query('COMMIT');
      
      const user = userInsert.rows[0];
      
      res.status(201).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          role: user.role
        },
        meta: { timestamp: new Date().toISOString() }
      });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, password, rememberMe } = req.body;
    
    if (!identifier || !password) {
      throw new BadRequestError('Identifier (email or mobile) and password are required');
    }
    
    const user = await pool.query(
      'SELECT id, email, mobile, password_hash, role FROM users WHERE email = $1 OR mobile = $1',
      [identifier]
    );
    
    if (user.rows.length === 0) {
      throw new AuthError('Invalid credentials');
    }
    
    const userData = user.rows[0];
    const passwordMatch = await bcrypt.compare(password, userData.password_hash);
    
    if (!passwordMatch) {
      throw new AuthError('Invalid credentials');
    }
    
    const jti = uuidv4();
    const secret = rememberMe === true ? env.JWT_REMEMBER_ME_SECRET : env.JWT_SECRET;
    const expiresIn = rememberMe === true ? '72h' : '8h';
    
    const token = jwt.sign(
      {
        sub: userData.id,
        role: userData.role,
        jti
      },
      secret,
      { expiresIn }
    );
    
    const expirationMs = rememberMe === true ? 72 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expirationMs).toISOString();
    
    res.status(200).json({
      success: true,
      data: {
        token,
        expiresAt,
        user: {
          id: userData.id,
          role: userData.role,
          email: userData.email,
          mobile: userData.mobile
        }
      },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const jti = req.user.jti;
    addToBlocklist(jti);
    
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout
};
