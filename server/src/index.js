const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');

async function start() {
  await connectDb();
  app.listen(env.PORT, () => {
    process.stdout.write(`Server listening on port ${env.PORT}\n`);
  });
}

start();
