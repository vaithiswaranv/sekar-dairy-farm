const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
let storage;

if (isCloudinaryConfigured) {
  // Cloudinary storage configuration
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      return {
        folder: 'sekar_dairy_farm',
        resource_type: isVideo ? 'video' : 'image',
        allowed_formats: isVideo 
          ? ['mp4', 'mov', 'avi', 'mkv', 'webm'] 
          : ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        public_id: `${Date.now()}-${path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')}`
      };
    }
  });
} else {
  // Local storage configuration
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
}

// File filter to validate types
const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  
  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Max 50MB file size (for videos)
  }
});

// @route   POST api/upload
// @desc    Upload an image or video
// @access  Private (Vendor only)
router.post('/', [auth, upload.single('media')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileData = {};

    if (isCloudinaryConfigured) {
      // Cloudinary returns path as 'path' or 'url', and public_id as 'filename'
      const isVideo = req.file.mimetype.startsWith('video/');
      fileData = {
        type: isVideo ? 'video' : 'image',
        url: req.file.path,
        public_id: req.file.filename
      };
    } else {
      // Local storage details
      const isVideo = req.file.mimetype.startsWith('video/');
      // Construct a URL path (e.g. /uploads/filename)
      const host = req.get('host');
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      
      fileData = {
        type: isVideo ? 'video' : 'image',
        url: fileUrl,
        public_id: req.file.filename // local filename as public_id
      };
    }

    res.json(fileData);
  } catch (err) {
    console.error('Upload route error:', err.message);
    res.status(500).json({ message: `Upload failed: ${err.message}` });
  }
});

module.exports = router;
