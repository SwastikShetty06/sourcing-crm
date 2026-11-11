const app = require('../server/src/app');
const { connectDb } = require('../server/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDb();
    return app(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
};
