const multer = require('multer');
const path = require('path');
const randomstring = require('randomstring');

function getExtension(mimetype) {
  switch (mimetype) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/gif': return 'gif';
    case 'image/bmp': return 'bmp';
    case 'audio/wav': return 'wav';
    case 'audio/mp3':
    case 'audio/mpeg': return 'mp3';
    case 'audio/mp4':
    case 'video/mp4': return 'mp4';
    case 'video/quicktime': return 'mov';
    case 'video/x-matroska': return 'mkv';
    default: return 'jpg';
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

  cb(null, path.join(__dirname, `../uploads/media`))
  },

  filename: (req, file, cb) => {
    const extension = getExtension(file.mimetype);
    const fileName = randomstring.generate(25);
    cb(null, `${fileName}.${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

module.exports = upload;