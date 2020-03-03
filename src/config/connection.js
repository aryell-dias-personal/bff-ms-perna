const mongoose = require('mongoose');

const options = {
  autoIndex: false,
  reconnectTries: 1,
  reconnectInterval: 500,
  poolSize: 2,
  bufferMaxEntries: 0,
  bufferCommands: false,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: process.env.DB_NAME
};

module.exports.generate = conn => new Promise((resolve, reject) => {
  if (conn && conn.db && conn.db.serverConfig &&
    conn.db.serverConfig.isConnected()) resolve(conn);

  mongoose.set('bufferCommands', false);

  mongoose.connection.on('error', errorConnectingToDatabase => reject(
    errorConnectingToDatabase));

  mongoose.connect(process.env.MONGO_URL, options).then(() => resolve(mongoose.connection));
});
