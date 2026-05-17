const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { cloudinary } = require('./Cloudinary');

ffmpeg.setFfmpegPath(
  "C:/Users/lenovo/Downloads/ffmpeg-2026-04-09-git-d3d0b7a5ee-full_build/bin/ffmpeg.exe"
);

const processVideo = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions('-movflags +faststart')
      .videoCodec('copy')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
};

const deleteFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      console.error("Failed to delete:", path, err);
    } else {
      console.log("Deleted:", path);
    }
  });
};

const uploadToCloudinary = async (filePath) => {
    const outputPath = `processed-${Date.now()}.mp4`;
  try {
    await processVideo(filePath, outputPath);

    const result = await cloudinary.uploader.upload(outputPath, {
      resource_type: "video",
    });

    return result.secure_url;

  } catch (err) {
    console.error(err);
    throw err;
  }
   finally {
    deleteFile(filePath);
    deleteFile(outputPath);
  }
};

module.exports = { uploadToCloudinary };