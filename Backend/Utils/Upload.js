const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { cloudinary } = require('./Cloudinary');

// On Render.com, fluent-ffmpeg automatically detects the global 'ffmpeg' installation.
// No manual executable path config is required.

/**
 * Optimizes the video structure for fast streaming via web browsers
 */
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

/**
 * Safely removes a file from the Render server disk if it exists
 */
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

/**
 * Core orchestrator to process the video locally on Render and push it to Cloudinary
 */
const uploadToCloudinary = async (filePath) => {
  // Generates a unique output name within the current directory context
  const outputPath = path.join(__dirname, `processed-${Date.now()}.mp4`);
  
  try {
    console.log("Starting video optimization on Render server...");
    await processVideo(filePath, outputPath);

    console.log("Uploading optimized file to Cloudinary...");
    const result = await cloudinary.uploader.upload(outputPath, {
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