const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Resolve the videos directory relative to this project's root
const VIDEOS_DIR = path.resolve(__dirname, '../../videos');

// GET /api/videos — list all .mp4 files in the videos folder
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(VIDEOS_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(VIDEOS_DIR).filter(f => /\.(mp4|webm|ogg|mkv|avi|mov)$/i.test(f));
    const videoList = files.map(name => ({
      name,
      filename: name,
      url: `/api/videos/stream/${encodeURIComponent(name)}`,
    }));
    res.json(videoList);
  } catch (err) {
    console.error('[videoRoutes] Error listing videos:', err.message);
    res.status(500).json({ error: 'Failed to list videos' });
  }
});

// GET /api/videos/stream/:filename — stream a video file with range support
router.get('/stream/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(VIDEOS_DIR, filename);

  // Security: ensure the resolved path stays within VIDEOS_DIR
  if (!filePath.startsWith(VIDEOS_DIR)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Handle range requests (required by <video> elements for seeking)
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1);
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

module.exports = router;
