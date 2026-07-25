const fs = require('fs');
const path = require('path');
const VendorInfo = require('../models/VendorInfo');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE_PATH = path.join(DATA_DIR, 'vendor-info.json');

const initFileStorage = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    const defaultInfo = {
      phone: '+919876543210',
      whatsappLink: 'https://wa.me/919876543210',
      mapsUrl: 'https://maps.google.com/?q=Sekar+Dairy+Farm',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(FILE_PATH, JSON.stringify(defaultInfo, null, 2));
  }
};

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

const getVendorInfo = async () => {
  if (isMongoConnected()) {
    let info = await VendorInfo.findOne();
    if (!info) {
      info = new VendorInfo();
      await info.save();
    }
    return info;
  } else {
    initFileStorage();
    try {
      const data = fs.readFileSync(FILE_PATH, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading vendor info file:', err);
      return {
        phone: '+919876543210',
        whatsappLink: 'https://wa.me/919876543210',
        mapsUrl: 'https://maps.google.com/?q=Sekar+Dairy+Farm'
      };
    }
  }
};

const updateVendorInfo = async (updateData) => {
  const cleanData = {
    phone: updateData.phone,
    whatsappLink: updateData.whatsappLink || '', // Optional field
    mapsUrl: updateData.mapsUrl,
    updatedAt: new Date()
  };

  if (isMongoConnected()) {
    let info = await VendorInfo.findOne();
    if (!info) {
      info = new VendorInfo(cleanData);
      return await info.save();
    } else {
      info.phone = cleanData.phone;
      info.whatsappLink = cleanData.whatsappLink;
      info.mapsUrl = cleanData.mapsUrl;
      info.updatedAt = cleanData.updatedAt;
      return await info.save();
    }
  } else {
    initFileStorage();
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ ...cleanData, updatedAt: cleanData.updatedAt.toISOString() }, null, 2));
      return cleanData;
    } catch (err) {
      console.error('Error writing vendor info file:', err);
      return cleanData;
    }
  }
};

const seedDefaultVendorInfo = async () => {
  try {
    await getVendorInfo();
    console.log('✅ Default vendor contact info initialized.');
  } catch (err) {
    console.error('Failed to seed default vendor info:', err);
  }
};

module.exports = {
  getVendorInfo,
  updateVendorInfo,
  seedDefaultVendorInfo
};
