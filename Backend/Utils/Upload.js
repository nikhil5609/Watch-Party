const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegStatic);
const { uploadToTigrisStorage } = require('./tigris');

// const processVideo = (inputPath, outputPath) => {
//   return new Promise((resolve, reject) => {
//     ffmpeg(inputPath)
//       .outputOptions('-movflags +faststart')
//       .videoCodec('copy')
//       .on('end', () => {
//         console.log("FFmpeg optimization complete.");
//         resolve(outputPath);
//       })
//       .on('error', (err) => {
//         console.error("FFmpeg processing error:", err.message);
//         reject(err);
//       })
//       .save(outputPath);
//   });
// };

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete local file:", filePath, err);
      else console.log("Successfully cleaned up local storage:", filePath);
    });
  }
};

const uploadVideo = async (filePath) => {
  const fileName = `${Date.now()}.mp4`;
  // const outputPath = path.join(__dirname, `processed-${fileName}`);
  const outputPath = filePath

  try {
    // console.log("Starting video optimization...");
    // await processVideo(filePath, outputPath);

    const stats = fs.statSync(outputPath);
    console.log("Processed file size:", (stats.size / (1024 * 1024)).toFixed(2), "MB");

    console.log("Uploading to Tigris...");
    const videoKey = await uploadToTigrisStorage(outputPath, fileName);
    console.log("Tigris upload successful!", videoKey);
    return videoKey;

  } catch (err) {
    console.error("Video pipeline failed:", err);
    throw err;
  } finally {
    console.log("Cleaning up local storage...");
    deleteFile(filePath);
    deleteFile(outputPath);
  }
};

module.exports = { uploadVideo };