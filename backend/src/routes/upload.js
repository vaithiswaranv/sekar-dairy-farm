const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { supabase, supabaseBucket, isSupabaseConfigured } = require('../config/supabase');

// Ensure local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
let storage;

if (isSupabaseConfigured) {
  // Use memory storage to process uploads directly to Supabase buffer
  storage = multer.memoryStorage();
} else if (isCloudinaryConfigured) {
  // Cloudinary storage configuration
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const isVideoOrAudio = file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
      return {
        folder: 'sekar_dairy_farm',
        resource_type: isVideoOrAudio ? 'video' : 'image',
        allowed_formats: isVideoOrAudio 
          ? ['mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'm4a', 'aac', 'ogg'] 
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

// @route   POST api/upload
// @desc    Upload an image, video, or audio
// @access  Private (Vendor only)
router.post('/', [auth, upload.single('media')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileData = {};

    if (isSupabaseConfigured) {
      // Ensure bucket exists in Supabase
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (!listError) {
          const bucketExists = buckets.some(b => b.name === supabaseBucket);
          if (!bucketExists) {
            await supabase.storage.createBucket(supabaseBucket, {
              public: true
            });
          }
        }
      } catch (bucketErr) {
        console.warn('Supabase bucket check/creation warning:', bucketErr.message);
      }

      // Upload memory buffer directly to Supabase Storage
      const isVideo = req.file.mimetype.startsWith('video/');
      const isAudio = req.file.mimetype.startsWith('audio/');
      
      const fileExt = path.extname(req.file.originalname) || (isVideo ? '.mp4' : (isAudio ? '.mp3' : '.jpg'));
      const sanitizedBaseName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${Date.now()}-${sanitizedBaseName}${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          duplex: 'half'
        });

      if (error) {
        throw new Error(`Supabase upload error: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(supabaseBucket)
        .getPublicUrl(fileName);

      fileData = {
        type: isVideo ? 'video' : (isAudio ? 'audio' : 'image'),
        url: publicUrl,
        public_id: fileName
      };
    } else if (isCloudinaryConfigured) {
      // Cloudinary returns path as 'path' or 'url', and public_id as 'filename'
      const isVideo = req.file.mimetype.startsWith('video/');
      const isAudio = req.file.mimetype.startsWith('audio/');
      fileData = {
        type: isVideo ? 'video' : (isAudio ? 'audio' : 'image'),
        url: req.file.path,
        public_id: req.file.filename
      };
    } else {
      // Local storage details
      const isVideo = req.file.mimetype.startsWith('video/');
      const isAudio = req.file.mimetype.startsWith('audio/');
      // Construct a URL path (e.g. /uploads/filename)
      const host = req.get('host');
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      
      fileData = {
        type: isVideo ? 'video' : (isAudio ? 'audio' : 'image'),
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
