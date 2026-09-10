const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    try {
      await cachedClient.db().admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      cachedClient = null;
      cachedDb = null;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });

  await client.connect();
  const db = client.db(); // uses db name from URI

  // Ensure indexes
  await db.collection('users').createIndex(
    { provider: 1, providerId: 1 },
    { unique: true }
  );
  await db.collection('users').createIndex({ email: 1 });

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection('users');
}

module.exports = {
  connectToDatabase,
  getUsersCollection
};
