import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import productRoutes from './routes/products.routes';
import salesRoutes from './routes/sales.routes';
import reportsRoutes from './routes/reports.routes';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.mendezdev\.online$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Basic request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
// We mount them both with and without /api prefix for Vercel resilience
const mountRoutes = (router: express.Router) => {
  router.use('/products', productRoutes);
  router.use('/sales', salesRoutes);
  router.use('/reports', reportsRoutes);
};

// Handle /api prefix
const apiRouter = express.Router();
mountRoutes(apiRouter);
app.use('/api', apiRouter);

// Handle root mapping (fallback for direct sub-path access)
mountRoutes(app as unknown as express.Router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`RG Store API running on port ${PORT}`);
  });
}

export default app;
