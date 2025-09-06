const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const { uploadVideo, getVideoUrl, deleteVideo ,uploadImage,getFileUrl} = require('./s3_video_management');

const TMP_DIR = '/tmp';

async function downloadFile(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios({ method: 'get', url, responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function mergePictureAndAudio(imagePath, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      '-y', // overwrite output if exists
      '-loop', '1',
      '-framerate', '2',
      '-i', imagePath,
      '-i', audioPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-tune', 'stillimage',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      outputPath
    ]);

    let errorOutput = '';

    ffmpeg.stderr.on('data', data => {
      errorOutput += data.toString();
    });

    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${errorOutput}`));
      }
    });
  });
}

const mergeAndUploadImgToS3 = async (imageUrl, audioUrl) => {
  const timestamp = Date.now();
  const imageExt = path.extname(imageUrl).split('?')[0] || '.jpg';
  const audioExt = path.extname(audioUrl).split('?')[0] || '.mp3';

  const imagePath = path.join(TMP_DIR, `${timestamp}_image${imageExt}`);
  const audioPath = path.join(TMP_DIR, `${timestamp}_audio${audioExt}`);
  const outputName = `${timestamp}_picture_audio_output.mp4`;
  const outputPath = path.join(TMP_DIR, outputName);
  const s3Key = `mashed/${outputName}`;

  try {
    // Parallel download
    await Promise.all([
      downloadFile(imageUrl, imagePath),
      downloadFile(audioUrl, audioPath)
    ]);

    // Merge with optimized ffmpeg
    await mergePictureAndAudio(imagePath, audioPath, outputPath);

    // Upload using stream
    const stream = fs.createReadStream(outputPath);
    await uploadVideo('your-bucket-name', s3Key, stream);

    // Cleanup
    await Promise.all([
      fsPromises.unlink(imagePath),
      fsPromises.unlink(audioPath),
      fsPromises.unlink(outputPath)
    ]);

    console.log(`✅ Uploaded to S3: ${s3Key}`);
    return { key: s3Key };
  } catch (err) {
    console.error('❌ Merge and upload failed:', err.message);
    throw {
      error: 'Merge and upload failed',
      details: err.message
    };
  }
};
