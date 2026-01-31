const mongoose = require('mongoose');

async function connect_to_db() {
  await mongoose.connect(process.env.DB_CONNECTION_STRING);
}

module.exports = connect_to_db;