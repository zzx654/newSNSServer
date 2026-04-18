const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath); 


function createThumbnail(videoPath, outputPath, fileName) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
         timestamps: ['1'],
        folder: outputPath,
        filename: `${fileName}.png`,
        size: '640x?'
      })
      .on('end', () => resolve(`${fileName}.png`))
      .on('error', reject);
  });
}

module.exports = createThumbnail;