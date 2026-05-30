import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { dbName: 'salaryDB' })
  .then(async () => {
    console.log('Connected');
    const records = await mongoose.connection.db.collection('salaryrecords').find({}).toArray();
    for (const r of records) {
      console.log(`User: ${r.username}, Year: ${r.year}, Month: ${r.month}`);
      console.log(`Cash: ${r.data?.cash?.length} employees`);
      console.log(`Cheque: ${r.data?.cheque?.length} employees`);
      console.log(`ESI: ${r.data?.esi?.length} employees`);
    }
    process.exit(0);
  });
