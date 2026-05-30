import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
.then(() => console.log('✅ Connected to MongoDB Cluster'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Mongoose Schema
const SalarySchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  data: {
    cash: { type: Array, default: [] },
    cheque: { type: Array, default: [] },
    esi: { type: Array, default: [] }
  }
}, { timestamps: true });

// Ensure unique year-month combo
SalarySchema.index({ year: 1, month: 1 }, { unique: true });

const SalaryRecord = mongoose.model('SalaryRecord', SalarySchema);

// API Endpoints

// 1. Get list of all saved months
app.get('/api/salaries', async (req, res) => {
  try {
    const records = await SalaryRecord.find({}, 'year month data').sort({ year: -1, month: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get data for a specific month
app.get('/api/salaries/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const record = await SalaryRecord.findOne({ year: Number(year), month: Number(month) });
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Save or update data for a month
app.post('/api/salaries', async (req, res) => {
  try {
    const { year, month, data } = req.body;
    
    // Upsert (update if exists, insert if not)
    const record = await SalaryRecord.findOneAndUpdate(
      { year, month },
      { $set: { year, month, data } },
      { new: true, upsert: true }
    );
    
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Delete a month
app.delete('/api/salaries/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    await SalaryRecord.findOneAndDelete({ year: Number(year), month: Number(month) });
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
