const fs = require('fs');
const path = require('path');
const Listing = require('../models/Listing');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE_PATH = path.join(DATA_DIR, 'listings.json');

const initFileStorage = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2));
  }
};

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

const readFromFile = () => {
  initFileStorage();
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading listings file:', err);
    return [];
  }
};

const writeToFile = (data) => {
  initFileStorage();
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing listings file:', err);
  }
};

const getAllListings = async (filters = {}) => {
  if (isMongoConnected()) {
    const query = {};
    if (filters.animalType) query.animalType = filters.animalType;
    if (filters.gender) query.gender = filters.gender;
    if (filters.breed) query.breed = new RegExp(filters.breed, 'i');
    if (filters.animalName) query.animalName = new RegExp(filters.animalName, 'i');
    if (filters.status) query.status = filters.status;
    if (filters.minPrice) query.price = { ...query.price, $gte: Number(filters.minPrice) };
    if (filters.maxPrice) query.price = { ...query.price, $lte: Number(filters.maxPrice) };
    
    return await Listing.find(query).sort({ createdAt: -1 });
  } else {
    let listings = readFromFile();
    
    // Apply filters locally
    if (filters.animalType) {
      listings = listings.filter(l => l.animalType === filters.animalType);
    }
    if (filters.gender) {
      listings = listings.filter(l => l.gender === filters.gender);
    }
    if (filters.breed) {
      const search = filters.breed.toLowerCase();
      listings = listings.filter(l => l.breed && l.breed.toLowerCase().includes(search));
    }
    if (filters.animalName) {
      const search = filters.animalName.toLowerCase();
      listings = listings.filter(l => l.animalName && l.animalName.toLowerCase().includes(search));
    }
    if (filters.status) {
      listings = listings.filter(l => l.status === filters.status);
    }
    if (filters.minPrice) {
      listings = listings.filter(l => l.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      listings = listings.filter(l => l.price <= Number(filters.maxPrice));
    }
    
    return listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const getListingById = async (id) => {
  if (isMongoConnected()) {
    return await Listing.findById(id);
  } else {
    const listings = readFromFile();
    return listings.find(l => l._id === id || l.id === id) || null;
  }
};

const createListing = async (listingData) => {
  if (isMongoConnected()) {
    const listing = new Listing(listingData);
    return await listing.save();
  } else {
    const listings = readFromFile();
    const newListing = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...listingData,
      createdAt: new Date().toISOString()
    };
    listings.push(newListing);
    writeToFile(listings);
    return newListing;
  }
};

const updateListing = async (id, updateData) => {
  if (isMongoConnected()) {
    return await Listing.findByIdAndUpdate(id, updateData, { new: true });
  } else {
    const listings = readFromFile();
    const index = listings.findIndex(l => l._id === id || l.id === id);
    if (index === -1) return null;
    
    listings[index] = {
      ...listings[index],
      ...updateData
    };
    writeToFile(listings);
    return listings[index];
  }
};

const deleteListing = async (id) => {
  if (isMongoConnected()) {
    return await Listing.findByIdAndDelete(id);
  } else {
    const listings = readFromFile();
    const index = listings.findIndex(l => l._id === id || l.id === id);
    if (index === -1) return null;
    
    const deleted = listings.splice(index, 1)[0];
    writeToFile(listings);
    return deleted;
  }
};

module.exports = {
  getAllListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
};
