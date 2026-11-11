const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');

async function start() {
  await connectDb();
  const port = process.env.PORT || env.PORT;
  app.listen(port, () => {
    process.stdout.write(`Server listening on port ${port}\n`);
  });
}

start();

module.exports = app;
