import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'salaryDB' })
  .then(async () => {
    const indexes = await mongoose.connection.db.collection('salaryrecords').indexes();
    console.log('Indexes:', JSON.stringify(indexes, null, 2));
    process.exit(0);
  });
