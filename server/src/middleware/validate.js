function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path.join('.') || 'root';
        fields[fieldName] = issue.message;
      }

      return res.status(400).json({
        message: 'Validation failed.',
        fields
      });
    }

    req[source] = result.data;
    next();
  };
}

module.exports = {
  validate
};
