const express = require('express');
const router = express.Router();
const vendorInfoService = require('../services/vendorInfoService');
const auth = require('../middleware/auth');

// @route   GET api/vendor-info
// @desc    Get vendor contact info (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const info = await vendorInfoService.getVendorInfo();
    res.json(info);
  } catch (err) {
    console.error('Error fetching vendor info:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/vendor-info
// @desc    Update vendor contact info
// @access  Private (Vendor only)
router.put('/', auth, async (req, res) => {
  const { phone, whatsappLink, mapsUrl } = req.body;

  if (!phone || !mapsUrl) {
    return res.status(400).json({ message: 'Please provide phone and mapsUrl fields' });
  }

  try {
    const updated = await vendorInfoService.updateVendorInfo({ phone, whatsappLink, mapsUrl });
    res.json(updated);
  } catch (err) {
    console.error('Error updating vendor info:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
