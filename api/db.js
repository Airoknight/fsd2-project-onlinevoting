const mongoose = require('mongoose');

let cachedConnection = global.mongooseConnection;

if (!cachedConnection) {
  cachedConnection = global.mongooseConnection = { conn: null, promise: null };
}

async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please configure MONGODB_URI in your environment variables (.env)');
  }

  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (!cachedConnection.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cachedConnection.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cachedConnection.conn = await cachedConnection.promise;
  } catch (e) {
    cachedConnection.promise = null;
    throw e;
  }

  return cachedConnection.conn;
}

module.exports = connectToDatabase;
