const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegStatic);
const { uploadToTigrisStorage, generatePresignedUrl } = require('./tigris');

// const processVideo = (inputPath, outputPath) => {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .outputOptions('-movflags +faststart')
//       .videoCodec('copy')
//       .audioCodec('copy')
//       .outputOptions('-preset ultrafast')
//       .on('end', () => resolve(outputPath))
//       .on('error', (err) => reject(err))
//       .save(outputPath);
//   });
// };

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete:", filePath, err);
      else console.log("Cleaned up:", filePath);
    });
  }
};

const uploadVideo = async (filePath) => {
  const fileName = `${Date.now()}.mp4`;
  const videoKey = fileName;
  const outputPath = filePath

  try {
    const stats = fs.statSync(filePath);
    console.log("Original size:", (stats.size / (1024 * 1024)).toFixed(2), "MB");

    // console.log("Optimizing for streaming...");
    // await processVideo(filePath, outputPath);

    console.log("Uploading to Tigris...");
    await uploadToTigrisStorage(outputPath, fileName);
    console.log("Upload successful! Key:", videoKey);

    
    return videoKey;

  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  } finally {
    deleteFile(filePath);
    deleteFile(outputPath); // processed file bhi clean karo
  }
};

module.exports = { uploadVideo };