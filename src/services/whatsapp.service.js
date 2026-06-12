const twilio = require('twilio');
const env = require('../config/env');

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

function formatIST(dateObj) {
  const istDate = new Date(dateObj.getTime() + 5.5 * 60 * 60 * 1000);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[istDate.getUTCDay()];
  const date = String(istDate.getUTCDate()).padStart(2, '0');
  const month = months[istDate.getUTCMonth()];
  const year = istDate.getUTCFullYear();
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  
  return `${date}-${month}-${year} ${hours}:${minutes} IST`;
}

function convertToTons(quantityKg) {
  return (quantityKg / 1000).toFixed(2);
}

async function sendOrderPlacedNotifications({
  ownerName,
  companyName,
  quantityKg,
  deliveryAt,
  customerMobile
}) {
  const tons = convertToTons(quantityKg);
  const formattedDelivery = formatIST(new Date(deliveryAt));
  
  const customerMessage = `Hello ${ownerName}, your order for ${tons} Tons of Sodium Silicate from Swastik Chemicals has been received. Expected delivery: ${formattedDelivery}.`;
  const adminMessage = `Alert: New order received from ${companyName} (${ownerName}) for ${tons} Tons of Sodium Silicate. Delivery target: ${formattedDelivery}.`;
  
  try {
    await client.messages.create({
      from: env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+91${customerMobile}`,
      body: customerMessage
    });
  } catch (err) {
    console.error('Failed to send customer order placed notification:', err.message);
  }
  
  try {
    await client.messages.create({
      from: env.TWILIO_WHATSAPP_FROM,
      to: env.ADMIN_WHATSAPP_TO,
      body: adminMessage
    });
  } catch (err) {
    console.error('Failed to send admin order placed notification:', err.message);
  }
}

async function sendOrderConfirmedNotifications({
  ownerName,
  companyName,
  quantityKg,
  deliveryAt,
  customerMobile
}) {
  const tons = convertToTons(quantityKg);
  const formattedDelivery = formatIST(new Date(deliveryAt));
  
  const customerMessage = `Hello ${ownerName}, your order for ${tons} Tons of Sodium Silicate from Swastik Chemicals has been confirmed. Expected delivery: ${formattedDelivery}.`;
  const adminMessage = `Alert: Order confirmed from ${companyName} (${ownerName}) for ${tons} Tons of Sodium Silicate. Delivery target: ${formattedDelivery}.`;
  
  try {
    await client.messages.create({
      from: env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+91${customerMobile}`,
      body: customerMessage
    });
  } catch (err) {
    console.error('Failed to send customer order confirmed notification:', err.message);
  }
  
  try {
    await client.messages.create({
      from: env.TWILIO_WHATSAPP_FROM,
      to: env.ADMIN_WHATSAPP_TO,
      body: adminMessage
    });
  } catch (err) {
    console.error('Failed to send admin order confirmed notification:', err.message);
  }
}

module.exports = {
  sendOrderPlacedNotifications,
  sendOrderConfirmedNotifications
};
