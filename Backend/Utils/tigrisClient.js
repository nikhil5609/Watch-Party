const { S3Client } = require("@aws-sdk/client-s3");

const tigrisClient = new S3Client({
  region: 'auto',
  endpoint: process.env.TIGRIS_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID,
    secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY,
  },
});

module.exports = {tigrisClient}