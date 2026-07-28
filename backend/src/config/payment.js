module.exports = {
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || 'placeholder',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'placeholder',
  },
  currency: 'USD',
  taxRate: 0.08,
  freeShippingThreshold: 50,
  shippingCost: 9.99,
};
