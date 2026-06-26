const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const {tigrisClient} = require('./tigrisClient')

const deleteFromTigris = async (s3Key) => {
  await tigrisClient.send(new DeleteObjectCommand({
    Bucket: process.env.TIGRIS_BUCKET_NAME,
    Key: `videos/${s3Key}`,
  }));
};

module.exports = {deleteFromTigris}