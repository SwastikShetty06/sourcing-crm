const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_DB: z.string().default('cp_ledger'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  PORT: z.coerce.number().default(5001),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  process.stderr.write('Environment validation failed:\n');
  for (const issue of result.error.issues) {
    process.stderr.write(`- ${issue.path.join('.')}: ${issue.message}\n`);
  }
  process.exit(1);
}

module.exports = result.data;
