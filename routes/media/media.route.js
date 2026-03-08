const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/audio', (req, res) => {

  const fileName = req.query.filename;

  if (!fileName) {
    return res.status(400).send('filename query parameter is required');
  }

  const filePath = path.join(__dirname, '../../uploads/audio', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'audio/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);

  } else {

    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mp4',
    };

    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);

  }

});


router.get('/image', (req, res) => {

 // const imgName = req.query.filename;
var imgName = req.param('filename')

  const filePath = path.join(__dirname, '../../uploads/post', imgName);

  res.setHeader('Content-Type', 'image/jpeg');

  res.sendFile(filePath);

});

router.get('/profile', (req, res) => {

  const fileName = req.query.filename;

  if (!fileName) {
    return res.status(400).send('filename query parameter is required');
  }

  const filePath = path.join(__dirname, '../../uploads/profile', fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.sendFile(filePath);

});

module.exports = router