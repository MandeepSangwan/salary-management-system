import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'salaryDB' })
  .then(async () => {
    console.log('Connected');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const records = await mongoose.connection.db.collection('salaryrecords').find({}).toArray();
    console.log('Records count:', records.length);
    if (records.length > 0) {
      console.log('First record username:', records[0].username);
      console.log('First record keys:', Object.keys(records[0]));
    }
    process.exit(0);
  });
