require('dotenv').config()

module.exports = {
  port: process.env.PORT || 5001,
  aesKey: process.env.AES_SECRET_KEY || '',
  paymentHmacSecret:
    process.env.PAYMENT_HMAC_SECRET || process.env.AES_SECRET_KEY || '',
  ticketHmacSecret:
    process.env.TICKET_HMAC_SECRET || process.env.AES_SECRET_KEY || '',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'tracknexa',
    user: process.env.DB_USER || 'ankusha',
    password: process.env.DB_PASSWORD || '',
  },
}
