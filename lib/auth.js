const { getUsersCollection } = require('./db');
const { ObjectId } = require('mongodb');

const DEFAULT_LIMIT = 30;

async function findOrCreateUser({ provider, providerId, name, email, avatar }) {
  const users = await getUsersCollection();
  const now = new Date();

  const existing = await users.findOne({ provider, providerId });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: name || existing.name,
          email: email || existing.email,
          avatar: avatar || existing.avatar,
          updatedAt: now
        }
      }
    );
    return { ...existing, name: name || existing.name, email: email || existing.email, avatar: avatar || existing.avatar };
  }

  const doc = {
    provider,
    providerId,
    name: name || 'User',
    email: email || null,
    avatar: avatar || null,
    usage: 0,
    limit: DEFAULT_LIMIT,
    createdAt: now,
    updatedAt: now
  };

  const result = await users.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

async function getUserById(userId) {
  if (!userId) return null;
  const users = await getUsersCollection();
  try {
    return await users.findOne({ _id: new ObjectId(userId) });
  } catch {
    return null;
  }
}

/**
 * Atomic increment usage. Returns updated user or null if limit reached.
 */
async function tryIncrementUsage(userId) {
  const users = await getUsersCollection();
  const result = await users.findOneAndUpdate(
    {
      _id: new ObjectId(userId),
      usage: { $lt: DEFAULT_LIMIT }
    },
    {
      $inc: { usage: 1 },
      $set: { updatedAt: new Date() }
    },
    { returnDocument: 'after' }
  );
  return result || null;
}

function publicUser(user) {
  if (!user) return null;
  const usage = user.usage || 0;
  const limit = user.limit || DEFAULT_LIMIT;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    provider: user.provider,
    usage,
    limit,
    remaining: Math.max(0, limit - usage),
    createdAt: user.createdAt
  };
}

module.exports = {
  findOrCreateUser,
  getUserById,
  tryIncrementUsage,
  publicUser,
  DEFAULT_LIMIT
};
