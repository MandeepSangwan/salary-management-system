import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'salaryDB' })
  .then(async () => {
    try {
      await mongoose.connection.db.collection('salaryrecords').dropIndex('year_1_month_1');
      console.log('Successfully dropped old index year_1_month_1');
    } catch (err) {
      console.error('Error dropping index:', err.message);
    }
    process.exit(0);
  });
