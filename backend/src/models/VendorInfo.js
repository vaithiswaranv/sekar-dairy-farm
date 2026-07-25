const mongoose = require('mongoose');

const VendorInfoSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    default: '+919876543210'
  },
  whatsappLink: {
    type: String,
    default: 'https://wa.me/919876543210'
  },
  mapsUrl: {
    type: String,
    required: true,
    default: 'https://maps.google.com/?q=Sekar+Dairy+Farm'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VendorInfo', VendorInfoSchema);
