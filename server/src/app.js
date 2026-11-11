const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const lookupsRoutes = require('./routes/lookups.routes');
const clientsRoutes = require('./routes/clients.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

const allowedOrigins = [
  env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/lookups', lookupsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/stats', statsRoutes);

if (env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
