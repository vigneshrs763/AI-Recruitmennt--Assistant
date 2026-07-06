import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import githubRoutes from './routes/github.js';
import jobRoutes from './routes/jobs.js';
import candidateRoutes from './routes/candidates.js';
import resumeRoutes from './routes/resumes.js';
import hiringRoutes from './routes/hiring.js';
import emailRoutes from './routes/email.js';
import aiAgentRoutes from './routes/aiAgent.js';
import User from './models/User.js';
import Job from './models/Job.js';
import Candidate from './models/Candidate.js';
import Resume from './models/Resume.js';
import Activity from './models/Activity.js';
import HindsightMemory from './models/HindsightMemory.js';
import EmailHistory from './models/EmailHistory.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.json({ message: 'AI Recruitment Assistant API is running' });
});

app.get('/api/health', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: connected ? 'connected' : 'unavailable',
    message: connected ? 'MongoDB is connected' : 'MongoDB is not connected; the API is running in degraded mode'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/hiring', hiringRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/ai', aiAgentRoutes);

const logRegisteredRoutes = (expressApp) => {
  const routes = [];
  expressApp._router?.stack?.forEach((layer) => {
    if (layer.route?.path) {
      const methods = Object.keys(layer.route.methods)
        .filter((method) => layer.route.methods[method])
        .map((method) => method.toUpperCase());
      routes.push(...methods.map((method) => `${method} ${layer.route.path}`));
    }

    if (layer.name === 'router' && layer.handle?.stack) {
      layer.handle.stack.forEach((subLayer) => {
        if (subLayer.route?.path) {
          const methods = Object.keys(subLayer.route.methods)
            .filter((method) => subLayer.route.methods[method])
            .map((method) => method.toUpperCase());
          routes.push(...methods.map((method) => `${method} /api${subLayer.route.path}`));
        }
      });
    }
  });

  console.log('Registered routes:');
  routes.forEach((route) => console.log(`- ${route}`));
};

logRegisteredRoutes(app);

app.get('/api/workspace', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    if (!payload?.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const [jobs, candidates, resumes, user] = await Promise.all([
      Job.find({ userId: payload.id }).sort({ createdAt: -1 }),
      Candidate.find({ userId: payload.id }).sort({ createdAt: -1 }),
      Resume.find({ userId: payload.id }).sort({ createdAt: -1 }),
      User.findById(payload.id)
    ]);

    res.json({
      user: user ? { id: user._id, name: user.name, email: user.email, companyName: user.companyName } : null,
      jobs,
      candidates,
      resumes
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load workspace', error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

export default app;
