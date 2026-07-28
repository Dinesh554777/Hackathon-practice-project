function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    if (schema.body) {
      const bodyErrors = validateFields(req.body, schema.body);
      errors.push(...bodyErrors);
    }
    if (schema.query) {
      const queryErrors = validateFields(req.query, schema.query);
      errors.push(...queryErrors);
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}

function validateFields(data, rules) {
  const errors = [];
  for (const [field, validations] of Object.entries(rules)) {
    const value = data[field];
    if (validations.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    if (value === undefined || value === null) continue;
    if (validations.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${field} must be a valid email`);
    }
    if (validations.minLength && value.length < validations.minLength) {
      errors.push(`${field} must be at least ${validations.minLength} characters`);
    }
    if (validations.maxLength && value.length > validations.maxLength) {
      errors.push(`${field} must be at most ${validations.maxLength} characters`);
    }
    if (validations.pattern && !validations.pattern.test(value)) {
      errors.push(validations.message || `${field} format is invalid`);
    }
  }
  return errors;
}

module.exports = { validate };
