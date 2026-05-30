import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Hardcoded users as requested
const USERS = {
  'golu': 'golu123',
  'mandeep': 'mandeep601'
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Disable caching for API responses (Fixes Vercel caching old data)
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  dbName: 'salaryDB',
})
.then(async () => {
  console.log('✅ Connected to MongoDB Cluster');
  
  // Data Migration: Assign existing records to 'golu'
  try {
    const result = await mongoose.connection.db.collection('salaryrecords').updateMany(
      { username: { $exists: false } },
      { $set: { username: 'golu' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Migrated ${result.modifiedCount} records to user 'golu'`);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema
const SalarySchema = new mongoose.Schema({
  username: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  data: {
    cash: { type: Array, default: [] },
    cheque: { type: Array, default: [] },
    esi: { type: Array, default: [] }
  }
}, { timestamps: true });

// Ensure unique year-month combo per user
SalarySchema.index({ username: 1, year: 1, month: 1 }, { unique: true });

const SalaryRecord = mongoose.model('SalaryRecord', SalarySchema);

// API Endpoints

// 0. Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (USERS[username] && USERS[username] === password) {
    res.json({ success: true, username });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// Middleware to protect routes
const requireUser = (req, res, next) => {
  const username = req.headers['x-user'];
  if (!username || !USERS[username]) {
    return res.status(401).json({ message: 'Unauthorized. Please login.' });
  }
  req.user = username;
  next();
};

// 1. Get list of all saved months for logged-in user
app.get('/api/salaries', requireUser, async (req, res) => {
  try {
    const records = await SalaryRecord.find({ username: req.user }, 'year month data').sort({ year: -1, month: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get data for a specific month for logged-in user
app.get('/api/salaries/:year/:month', requireUser, async (req, res) => {
  try {
    const { year, month } = req.params;
    const record = await SalaryRecord.findOne({ username: req.user, year: Number(year), month: Number(month) });
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Save or update data for a month for logged-in user
app.post('/api/salaries', requireUser, async (req, res) => {
  try {
    const { year, month, data } = req.body;
    
    // Upsert (update if exists, insert if not)
    const record = await SalaryRecord.findOneAndUpdate(
      { username: req.user, year, month },
      { $set: { username: req.user, year, month, data } },
      { new: true, upsert: true }
    );
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Delete a month for logged-in user
app.delete('/api/salaries/:year/:month', requireUser, async (req, res) => {
  try {
    const { year, month } = req.params;
    await SalaryRecord.findOneAndDelete({ username: req.user, year: Number(year), month: Number(month) });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start Server (Only for local development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel Serverless
export default app;
