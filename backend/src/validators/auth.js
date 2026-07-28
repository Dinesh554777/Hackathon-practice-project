const registerSchema = {
  body: {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 8, maxLength: 128 },
  },
};

const loginSchema = {
  body: {
    email: { required: true, type: 'email' },
    password: { required: true, minLength: 1 },
  },
};

const mfaVerifySchema = {
  body: {
    token: { required: true, minLength: 6, maxLength: 6 },
  },
};

module.exports = { registerSchema, loginSchema, mfaVerifySchema };
