const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const {
  BadRequestError,
  NotFoundError
} = require('../middleware/errorHandler');

async function createProduct(req, res, next) {
  try {
    const { productName, grade, moqKg, pricePerKg, isActive } = req.body;
    
    if (!productName) {
      throw new BadRequestError('Product name is required');
    }
    
    const moq = parseFloat(moqKg);
    if (moq <= 0) {
      throw new BadRequestError('MOQ must be greater than 0');
    }
    
    if (pricePerKg !== undefined && pricePerKg !== null) {
      const price = parseFloat(pricePerKg);
      if (price <= 0) {
        throw new BadRequestError('Price per kg must be greater than 0');
      }
    }
    
    const productId = uuidv4();
    const active = isActive !== false;
    const gradeVal = grade || 'TEXTILE';
    const priceVal = pricePerKg || null;
    
    const newProduct = await pool.query(
      `INSERT INTO products (id, product_name, grade, moq_kg, price_per_kg, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, product_name, grade, moq_kg, price_per_kg, is_active, created_at`,
      [productId, productName, gradeVal, moq, priceVal, active]
    );
    
    res.status(201).json({
      success: true,
      data: newProduct.rows[0],
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const { activeOnly } = req.query;
    
    let query = 'SELECT id, product_name, grade, moq_kg, price_per_kg, is_active, created_at FROM products';
    const params = [];
    
    if (activeOnly === 'true') {
      query += ' WHERE is_active = $1';
      params.push(true);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const products = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      data: products.rows,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProduct,
  listProducts
};
