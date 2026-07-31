const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Ensure local uploads directory exists for fallback disk storage
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Memory Storage Configuration
const storage = multer.memoryStorage();

// File filter to validate types
const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');
  
  if (isImage || isVideo || isAudio) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and audio are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Max 50MB file size (for videos)
  }
});

let bucket;

// Helper to get GridFSBucket instance
const getBucket = () => {
  if (!bucket && mongoose.connection.readyState === 1) {
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'livestock_media'
    });
  }
  return bucket;
};

// @route   POST api/upload
// @desc    Upload an image, video, or audio directly to MongoDB GridFS with local fallback
// @access  Private (Vendor only)
router.post('/', [auth, upload.single('media')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const activeBucket = getBucket();
    const isVideo = req.file.mimetype.startsWith('video/');
    const isAudio = req.file.mimetype.startsWith('audio/');
    
    const fileExt = path.extname(req.file.originalname) || (isVideo ? '.mp4' : (isAudio ? '.mp3' : '.jpg'));
    const sanitizedBaseName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedBaseName}${fileExt}`;

    const host = req.get('host');
    const protocol = req.protocol;
    
    // Support HTTPS on hosting systems like Render
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const scheme = isLocalhost ? protocol : 'https';

    if (activeBucket) {
      // Upload buffer to GridFS
      const uploadStream = activeBucket.openUploadStream(fileName, {
        contentType: req.file.mimetype
      });

      const fileId = uploadStream.id;

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
        uploadStream.end(req.file.buffer);
      });

      const fileUrl = `${scheme}://${host}/api/upload/file/${fileId}`;

      const fileData = {
        type: isVideo ? 'video' : (isAudio ? 'audio' : 'image'),
        url: fileUrl,
        public_id: fileId.toString()
      };

      res.json(fileData);
    } else {
      // Fallback: save to local disk
      console.warn('⚠️ Database not connected. Saving file to local disk uploads folder temporarily.');
      const filePath = path.join(UPLOADS_DIR, fileName);
      
      fs.writeFileSync(filePath, req.file.buffer);

      const fileUrl = `${scheme}://${host}/uploads/${fileName}`;

      const fileData = {
        type: isVideo ? 'video' : (isAudio ? 'audio' : 'image'),
        url: fileUrl,
        public_id: fileName
      };

      res.json(fileData);
    }
  } catch (err) {
    console.error('Upload route error:', err.message);
    res.status(500).json({ message: `Upload failed: ${err.message}` });
  }
});

// @route   GET api/upload/file/:id
// @desc    Retrieve file from GridFS database
// @access  Public
router.get('/file/:id', async (req, res) => {
  try {
    const activeBucket = getBucket();
    if (!activeBucket) {
      return res.status(503).json({ message: 'Storage database not connected' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);

    // Find file metadata document to set content type
    const files = await activeBucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set('Content-Type', files[0].contentType);
    // Cache files for 7 days since they are permanent
    res.set('Cache-Control', 'public, max-age=604800');
    
    // Pipe download stream to client response
    const downloadStream = activeBucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
  } catch (err) {
    console.error('File retrieval error:', err.message);
    res.status(404).json({ message: 'File not found' });
  }
});

// Helper function to delete file from GridFS programmatically
const deleteFileFromGridFS = async (id) => {
  try {
    const activeBucket = getBucket();
    if (!activeBucket || !id) return false;
    
    // Check if ID is a valid ObjectId (since fallback files have string filenames as public_id)
    if (mongoose.Types.ObjectId.isValid(id)) {
      const fileId = new mongoose.Types.ObjectId(id);
      await activeBucket.delete(fileId);
      return true;
    } else {
      // Fallback: Delete local file if it exists on disk
      const filePath = path.join(UPLOADS_DIR, id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    }
  } catch (err) {
    console.warn(`File deletion warning for ${id}:`, err.message);
    return false;
  }
};

// Export both the router and the deletion helper
router.deleteFileFromGridFS = deleteFileFromGridFS;
module.exports = router;
