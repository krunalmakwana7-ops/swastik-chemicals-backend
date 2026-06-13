const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const whatsappService = require('../services/whatsapp.service');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} = require('../middleware/errorHandler');

async function createOrder(req, res, next) {
  try {
    const { productId, quantityKg, requestedDeliveryAt } = req.body;
    const customerId = req.user.sub;
    
    if (!productId || !quantityKg || !requestedDeliveryAt) {
      throw new BadRequestError('Product ID, quantity, and delivery date are required');
    }
    
    const quantityNum = parseFloat(quantityKg);
    if (quantityNum < 1000) {
      throw new BadRequestError(
        'Minimum order quantity is 1,000 kg (1 metric ton).',
        { error: 'MOQ_VIOLATION', minimum_kg: 1000 }
      );
    }
    
    const minDelivery = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const requestedDate = new Date(requestedDeliveryAt);
    if (requestedDate < minDelivery) {
      throw new BadRequestError(
        'Delivery must be scheduled at least 24 hours from now.',
        { error: 'LEAD_TIME_VIOLATION', earliest_allowed: minDelivery.toISOString() }
      );
    }
    
    const product = await pool.query(
      'SELECT id, is_active FROM products WHERE id = $1',
      [productId]
    );
    
    if (product.rows.length === 0) {
      throw new NotFoundError('Product not found');
    }
    
    if (!product.rows[0].is_active) {
      throw new BadRequestError('Product is inactive');
    }
    
    const customerProfile = await pool.query(
      'SELECT cp.owner_name, cp.company_name, u.mobile FROM customer_profiles cp JOIN users u ON cp.user_id = u.id WHERE u.id = $1',
      [customerId]
    );
    
    if (customerProfile.rows.length === 0) {
      throw new NotFoundError('Customer profile not found');
    }
    
    const orderId = uuidv4();
    const { owner_name, company_name, mobile } = customerProfile.rows[0];
    
    const newOrder = await pool.query(
      `INSERT INTO orders (id, customer_id, product_id, quantity_kg, requested_delivery_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, customer_id, product_id, quantity_kg, order_status, requested_delivery_at, created_at`,
      [orderId, customerId, productId, quantityNum, requestedDeliveryAt]
    );
    
    const order = newOrder.rows[0];
    
    await whatsappService.sendOrderPlacedNotifications({
      ownerName: owner_name,
      companyName: company_name,
      quantityKg: quantityNum,
      deliveryAt: requestedDeliveryAt,
      customerMobile: mobile
    });
    
    res.status(201).json({
      success: true,
      data: order,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    let query;
    let params;
    
    if (userRole === 'ADMIN') {
      query = `SELECT o.id, o.customer_id, o.product_id, o.quantity_kg, o.order_status, 
               o.requested_delivery_at, o.confirmed_delivery_at, o.created_at
               FROM orders o
               ORDER BY o.created_at DESC`;
      params = [];
    } else {
      query = `SELECT o.id, o.customer_id, o.product_id, o.quantity_kg, o.order_status,
               o.requested_delivery_at, o.confirmed_delivery_at, o.created_at
               FROM orders o
               WHERE o.customer_id = $1
               ORDER BY o.created_at DESC`;
      params = [userId];
    }
    
    const orders = await pool.query(query, params);
    
    res.status(200).json({
      success: true,
      data: orders.rows,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

async function getOrderDetail(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const userRole = req.user.role;
    
    const order = await pool.query(
      'SELECT id, customer_id, product_id, quantity_kg, order_status, requested_delivery_at, confirmed_delivery_at, created_at FROM orders WHERE id = $1',
      [id]
    );
    
    if (order.rows.length === 0) {
      throw new NotFoundError('Order not found');
    }
    
    const orderData = order.rows[0];
    
    if (userRole === 'CUSTOMER' && orderData.customer_id !== userId) {
      throw new ForbiddenError('You do not have permission to view this order');
    }
    
    res.status(200).json({
      success: true,
      data: orderData,
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      throw new BadRequestError('Status is required');
    }
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('Invalid status value');
    }
    
    const order = await pool.query(
      'SELECT id, order_status, customer_id, quantity_kg, requested_delivery_at FROM orders WHERE id = $1',
      [id]
    );
    
    if (order.rows.length === 0) {
      throw new NotFoundError('Order not found');
    }
    
    const currentStatus = order.rows[0].order_status;
    const allowedTransitions = {
      'PENDING': ['CONFIRMED'],
      'CONFIRMED': ['DISPATCHED'],
      'DISPATCHED': ['DELIVERED'],
      'DELIVERED': []
    };
    
    if (!allowedTransitions[currentStatus].includes(status)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${status}`,
        { error: 'INVALID_STATUS_TRANSITION', current: currentStatus, attempted: status }
      );
    }
    
    const confirmedDeliveryAt = status === 'CONFIRMED' ? new Date().toISOString() : null;
    
    const updated = await pool.query(
      `UPDATE orders
       SET order_status = $1, confirmed_delivery_at = COALESCE($2, confirmed_delivery_at)
       WHERE id = $3
       RETURNING id, customer_id, product_id, quantity_kg, order_status, requested_delivery_at, confirmed_delivery_at, created_at`,
      [status, confirmedDeliveryAt, id]
    );
    
    if (status === 'CONFIRMED') {
      const customerProfile = await pool.query(
        'SELECT cp.owner_name, cp.company_name, u.mobile FROM customer_profiles cp JOIN users u ON cp.user_id = u.id WHERE u.id = $1',
        [order.rows[0].customer_id]
      );
      
      if (customerProfile.rows.length > 0) {
        const { owner_name, company_name, mobile } = customerProfile.rows[0];
        await whatsappService.sendOrderConfirmedNotifications({
          ownerName: owner_name,
          companyName: company_name,
          quantityKg: order.rows[0].quantity_kg,
          deliveryAt: order.rows[0].requested_delivery_at,
          customerMobile: mobile
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: updated.rows[0],
      meta: { timestamp: new Date().toISOString() }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  listOrders,
  getOrderDetail,
  updateOrderStatus
};
