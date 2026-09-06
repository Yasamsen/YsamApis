// MongoDB connection helper. Caches the client/connection across
// invocations so a new connection isn't opened on every request,
// which is required for correct behavior on Vercel Serverless Functions.
//
// "mongodb" is required lazily (inside the function) instead of at the
// top of the file so that code depending on this module (like the
// manifest generator) can still load without the package installed.

let cachedClient = null;
let cachedDb = null;
let indexesEnsured = false;

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  const { MongoClient } = require("mongodb");

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, { maxPoolSize: 10 });
  }

  await cachedClient.connect();

  const dbName = process.env.MONGODB_DB || "samapi";
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
}

async function getUsersCollection() {
  const db = await connectToDatabase();
  const col = db.collection("users");

  if (!indexesEnsured) {
    await col.createIndex({ provider: 1, providerId: 1 }, { unique: true });
    await col.createIndex({ email: 1 });
    indexesEnsured = true;
  }

  return col;
}

module.exports = { connectToDatabase, getUsersCollection };
