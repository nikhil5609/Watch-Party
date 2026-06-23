const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');

const tigrisClient = new S3Client({
  region: 'auto',
  endpoint: 'https://t3.storage.dev',
  credentials: {
    accessKeyId: "tid_XgIXYXpbDYeBgQrQHTj_bwqZUkBbdZsFyQIctKrAEJHSZWhwWX",
    secretAccessKey: "tsec_RCyqe6gB2Uu7Y-3Ajq9zClYsiIZJ4gVgdRbemqi1kQFVJv-kGXoNs_wPYYxcSFTOApNCDR",
  },
});

const BUCKET_NAME = "cinesync";

const uploadToTigrisStorage = async (filePath, fileName) => {
  const fileStream = fs.createReadStream(filePath);
  const fileStats = fs.statSync(filePath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `videos/${fileName}`,
    Body: fileStream,
    ContentType: 'video/mp4',
    ContentLength: fileStats.size,
    ACL: 'public-read',
  });

  await tigrisClient.send(command);
  return fileName;
};



const generatePresignedUrl = async (videoKey) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `videos/${videoKey}`,
    });
    return await getSignedUrl(tigrisClient, command, { expiresIn: 604800 });
  } catch (error) {
    console.error("❌ Failed to generate url:", err.message);
  }
};

module.exports = { tigrisClient, uploadToTigrisStorage, generatePresignedUrl };
