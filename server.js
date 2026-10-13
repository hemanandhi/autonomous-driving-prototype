require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Attempt database initialization (auto-fallbacks to demo mode if unavailable)
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` SIH 2026: Autonomous Vehicle Path Planning & Collision Avoidance`);
      console.log(` Problem Statement ID: SIH26037`);
      console.log(` Backend API server running on port: ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Storage mode: ${(process.env.STORAGE_MODE || 'auto').toUpperCase()}`);
      console.log(`=======================================================`);
    });

    const shutdown = () => {
      console.log('\n[Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('[Server Error] Fatal startup exception:', err.message);
    process.exit(1);
  }
}

startServer();
