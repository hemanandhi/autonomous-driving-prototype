const mongoose = require('mongoose');

let activeStorageMode = 'demo';
let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autonomous_driving';
  const configuredMode = (process.env.STORAGE_MODE || 'auto').toLowerCase();

  if (configuredMode === 'demo') {
    activeStorageMode = 'demo';
    isConnected = false;
    console.log('[Storage] Configured STORAGE_MODE=demo. Operating in Temporary In-Memory Demo Mode.');
    return { mode: 'demo', connected: false };
  }

  try {
    console.log(`[Storage] Attempting MongoDB connection to ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });
    activeStorageMode = 'mongodb';
    isConnected = true;
    console.log('[Storage] MongoDB connected successfully. Mode: mongodb');
    return { mode: 'mongodb', connected: true };
  } catch (err) {
    if (configuredMode === 'mongodb') {
      console.error('[Storage Error] Strict MongoDB mode required (STORAGE_MODE=mongodb), but connection failed:', err.message);
      activeStorageMode = 'mongodb_error';
      isConnected = false;
      throw new Error(`MongoDB connection failed and STORAGE_MODE=mongodb: ${err.message}`);
    }

    // Auto fallback to demo mode
    activeStorageMode = 'demo';
    isConnected = false;
    console.warn('[Storage Notice] MongoDB unreachable. Auto-switched to Temporary In-Memory Demo Mode.');
    console.warn('[Storage Notice] NOTE: Records created in demo mode are kept in-memory and will NOT persist after backend restart.');
    return { mode: 'demo', connected: false };
  }
};

const getStorageStatus = () => ({
  mode: activeStorageMode,
  connected: isConnected,
  label: isConnected ? 'MongoDB Connected' : 'Temporary In-Memory Demo Mode',
  warning: !isConnected ? 'Records are temporary and will be lost on backend restart.' : null
});

module.exports = {
  connectDB,
  getStorageStatus
};
