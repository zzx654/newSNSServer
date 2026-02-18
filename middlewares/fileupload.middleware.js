const multer = require('multer');
const path = require('path');
const randomstring = require('randomstring');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../files'));
  },
  filename: (req, file, cb) => {

    let extension;

    switch (file.mimetype) {
      case 'image/jpeg':
        extension = 'jpg';
        break;
      case 'image/png':
        extension = 'png';
        break;
      case 'image/gif':
        extension = 'gif';
        break;
      case 'image/bmp':
        extension = 'bmp';
        break;
      case 'audio/wav':
        extension = 'wav';
        break;
      case 'audio/mp3':
        extension = 'mp3';
        break;
      case 'audio/mpeg':
        extension = 'mp3';
        break;
      case 'audio/mp4':
      case 'video/mp4':
        extension = 'mp4';
        break;
      default:
        extension = 'jpg';
    }

    const fileName = randomstring.generate(25);
    cb(null, `${fileName}.${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = upload;