const createProductSchema = {
  body: {
    name: { required: true, minLength: 1, maxLength: 200 },
    price: { required: true },
    stock: { required: true },
  },
};

const updateProductSchema = {
  body: {
    name: { minLength: 1, maxLength: 200 },
  },
};

const categorySchema = {
  body: {
    name: { required: true, minLength: 1, maxLength: 100 },
  },
};

module.exports = { createProductSchema, updateProductSchema, categorySchema };
