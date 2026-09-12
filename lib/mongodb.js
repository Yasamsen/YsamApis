const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connectMongo() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB');

  // Create indexes
  await db.collection('access_keys').createIndex({ keyHash: 1 }, { unique: true });
  await db.collection('access_keys').createIndex({ role: 1 });
  await db.collection('access_keys').createIndex({ status: 1 });
  await db.collection('files').createIndex({ folderId: 1 });
  await db.collection('files').createIndex({ name: 'text' });
  await db.collection('files').createIndex({ storageKey: 1 }, { unique: true });
  await db.collection('folders').createIndex({ parentId: 1 });
  await db.collection('folders').createIndex({ name: 1, parentId: 1 });

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongo() first.');
  }
  return db;
}

async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { connectMongo, getDb, closeMongo };
