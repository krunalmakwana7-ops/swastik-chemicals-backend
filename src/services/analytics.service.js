const pool = require('../config/db');

async function getClientUsageAnalytics() {
  const query = `
WITH order_summaries AS (
  SELECT
    o.customer_id,
    o.order_status,
    o.quantity_kg,
    o.created_at,
    ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.created_at DESC) as rn
  FROM orders o
),
delivered_dispatched AS (
  SELECT
    customer_id,
    SUM(quantity_kg) as total_volume_kg
  FROM orders
  WHERE order_status IN ('DELIVERED', 'DISPATCHED')
  GROUP BY customer_id
),
status_breakdown AS (
  SELECT
    customer_id,
    jsonb_object_agg(
      order_status,
      status_count
    ) as status_counts
  FROM (
    SELECT
      customer_id,
      order_status,
      COUNT(*) as status_count
    FROM orders
    GROUP BY customer_id, order_status
  ) sub
  GROUP BY customer_id
)
SELECT
  cp.company_name,
  cp.owner_name,
  cp.gst_number,
  COUNT(DISTINCT o.id) as total_orders,
  COALESCE(dd.total_volume_kg, 0)::NUMERIC as total_volume_kg,
  ROUND(COALESCE(dd.total_volume_kg, 0) / 1000.0, 2)::NUMERIC as total_volume_tons,
  MAX(o.created_at)::TIMESTAMPTZ as last_order_date,
  ROUND(AVG(o.quantity_kg), 2)::NUMERIC as avg_order_kg,
  COALESCE(sb.status_counts, '{}'::jsonb) as order_status_breakdown
FROM customer_profiles cp
JOIN users u ON cp.user_id = u.id
LEFT JOIN orders o ON u.id = o.customer_id
LEFT JOIN delivered_dispatched dd ON u.id = dd.customer_id
LEFT JOIN status_breakdown sb ON u.id = sb.customer_id
WHERE u.role = 'CUSTOMER'
GROUP BY cp.id, cp.company_name, cp.owner_name, cp.gst_number, dd.total_volume_kg, sb.status_counts
ORDER BY total_volume_kg DESC;
  `;
  
  const result = await pool.query(query);
  return result.rows;
}

module.exports = {
  getClientUsageAnalytics
};
