const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({
  animalName: {
    type: String,
    required: true,
    trim: true
  },
  animalType: {
    type: String,
    required: true,
    enum: ['Cow', 'Goat', 'Cow Calf', 'Goat Kid'],
    default: 'Cow'
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female'],
    default: 'Female'
  },
  breed: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  ageYears: {
    type: Number,
    required: true,
    min: 0
  },
  ageMonths: {
    type: Number,
    required: true,
    min: 0,
    max: 11
  },
  teethCount: {
    type: Number,
    required: true,
    min: 0
  },
  milkCapacity: {
    type: Number, // In liters per day (optional)
    min: 0,
    default: null
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Sold'],
    default: 'Available'
  },
  calfKidStatus: {
    type: String,
    default: ''
  },
  media: [
    {
      type: {
        type: String,
        enum: ['image', 'video'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      public_id: {
        type: String,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Listing', ListingSchema);
