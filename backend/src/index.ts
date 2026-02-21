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
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
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

// Routes
// We mount them both with and without /api prefix to handle different Vercel routing scenarios
const mountRoutes = (router: express.Router) => {
  router.use('/products', productRoutes);
  router.use('/sales', salesRoutes);
  router.use('/reports', reportsRoutes);
};

// Create a router for /api
const apiRouter = express.Router();
mountRoutes(apiRouter);
app.use('/api', apiRouter);

// Also mount them directly on the app (standard fallback)
app.use('/products', productRoutes);
app.use('/sales', salesRoutes);
app.use('/reports', reportsRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`RG Store API running on port ${PORT}`);
  });
}

export default app;
