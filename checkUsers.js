import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'salaryDB' })
  .then(async () => {
    const usernames = await mongoose.connection.db.collection('salaryrecords').distinct('username');
    console.log('Usernames in DB:', usernames);
    process.exit(0);
  });
