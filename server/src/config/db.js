const mongoose = require('mongoose');
const env = require('./env');

let isConnected = false;

async function connectDb() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB
    });
    isConnected = true;
  } catch (err) {
    process.stderr.write(`Database connection failure: ${err.message}\n`);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw err;
  }
}

module.exports = {
  connectDb
};
