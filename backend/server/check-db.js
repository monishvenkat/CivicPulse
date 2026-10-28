import 'dotenv/config';
import dns from 'node:dns';
import mongoose from 'mongoose';

const configuredDns = process.env.DNS_SERVERS?.split(',').map(s => s.trim()).filter(Boolean);
if (configuredDns?.length) {
  dns.setServers(configuredDns);
}

const mongoUri = process.env.MONGODB_URI;
console.log('Testing connection to:', mongoUri.replace(/:([^:@]+)@/, ':****@'));

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('SUCCESS: Connected to MongoDB Atlas!');
  console.log('Database name:', mongoose.connection.name);
  console.log('ReadyState:', mongoose.connection.readyState);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error('ERROR connecting to MongoDB:', err.message);
  process.exit(1);
}
