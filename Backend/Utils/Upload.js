const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { cloudinary } = require('./Cloudinary');

const processVideo = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-movflags +faststart')
      .videoCodec('copy')
      .on('end', () => {
        console.log("FFmpeg optimization complete.");
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error("FFmpeg processing error:", err.message);
        reject(err);
      })
      .save(outputPath);
  });
};

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Failed to delete local file:", filePath, err);
      } else {
        console.log("Successfully cleaned up local storage:", filePath);
      }
    });
  }
};

const uploadToCloudinary = async (filePath) => {
  console.log("A3");

  const outputPath = path.join(__dirname, `processed-${Date.now()}.mp4`);
  console.log("A4", outputPath);

  try {
    console.log("Starting video optimization on Render server...");
    await processVideo(filePath, outputPath);


    const stats = fs.statSync(outputPath);
    console.log(
      "Processed file size:",
      (stats.size / (1024 * 1024)).toFixed(2),
      "MB"
    );


    console.log("Uploading optimized file to Cloudinary...");
    const result = await cloudinary.uploader.upload_large(outputPath, {
      resource_type: "video",
    });

    console.log("Cloudinary upload successful!");
    return result.secure_url;

  } catch (err) {
    console.error("Video pipeline execution failed:", err);
    throw err;
  } finally {
    // Crucial for Render Free Tier to prevent disk space exhaustion
    console.log("Running server storage cleanup...");
    deleteFile(filePath);
    deleteFile(outputPath);
  }
};

module.exports = { uploadToCloudinary };