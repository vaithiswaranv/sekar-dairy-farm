const express = require('express');
const router = express.Router();
const listingService = require('../services/listingService');
const auth = require('../middleware/auth');
const uploadRouter = require('./upload');

// @route   GET api/listings
// @desc    Get all listings (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const filters = {
      animalType: req.query.animalType,
      gender: req.query.gender,
      breed: req.query.breed,
      animalName: req.query.animalName,
      status: req.query.status,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice
    };
    
    const listings = await listingService.getAllListings(filters);
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/listings/:id
// @desc    Get single listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) {
    console.error('Error fetching listing:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/listings
// @desc    Create a listing
// @access  Private (Vendor only)
router.post('/', auth, async (req, res) => {
  const { 
    animalName, 
    animalType, 
    gender,
    breed, 
    description, 
    voiceDescription,
    age, 
    teethCount, 
    milkCapacity, 
    price, 
    media, 
    status, 
    calfKidStatus 
  } = req.body;

  // Mandatory fields validation (requires either description OR voiceDescription)
  if (!animalName || !animalType || !gender || !breed || (!description && !voiceDescription) || age === undefined || teethCount === undefined || price === undefined) {
    return res.status(400).json({ message: 'Please include all mandatory fields: Animal Name, Category, Gender, Breed, Age, Teeth count, Price, and either Description or Voice Message.' });
  }

  try {
    const isAdultFemale = (animalType === 'Cow' || animalType === 'Goat') && gender === 'Female';
    const newListing = await listingService.createListing({
      animalName,
      animalType,
      gender,
      breed,
      description: description || '',
      voiceDescription: voiceDescription || '',
      age: String(age),
      teethCount: String(teethCount),
      milkCapacity: isAdultFemale && milkCapacity !== null && milkCapacity !== undefined && milkCapacity !== '' ? String(milkCapacity) : '',
      price: Number(price),
      status: status || 'Available',
      calfKidStatus: isAdultFemale ? (calfKidStatus || '') : '',
      media: media || []
    });

    res.status(201).json(newListing);
  } catch (err) {
    console.error('Error creating listing:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/listings/:id
// @desc    Update a listing
// @access  Private (Vendor only)
router.put('/:id', auth, async (req, res) => {
  try {
    let listing = await listingService.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const updatePayload = { ...req.body };
    
    // Validate that at least one description type remains present
    const finalDesc = updatePayload.description !== undefined ? updatePayload.description : listing.description;
    const finalVoice = updatePayload.voiceDescription !== undefined ? updatePayload.voiceDescription : listing.voiceDescription;
    if (!finalDesc && !finalVoice) {
      return res.status(400).json({ message: 'At least one of Description or Voice Message must be provided.' });
    }
    
    // Cast fields if present in update payload
    if (updatePayload.age !== undefined) updatePayload.age = String(updatePayload.age);
    if (updatePayload.teethCount !== undefined) updatePayload.teethCount = String(updatePayload.teethCount);
    if (updatePayload.price !== undefined) updatePayload.price = Number(updatePayload.price);
    
    // Clean up conditional fields if gender is Male or Category is Cow Calf/Goat Kid
    const animalType = updatePayload.animalType !== undefined ? updatePayload.animalType : listing.animalType;
    const gender = updatePayload.gender !== undefined ? updatePayload.gender : listing.gender;
    const isAdultFemale = (animalType === 'Cow' || animalType === 'Goat') && gender === 'Female';

    if (!isAdultFemale) {
      updatePayload.milkCapacity = '';
      updatePayload.calfKidStatus = '';
    } else if (updatePayload.hasOwnProperty('milkCapacity')) {
      updatePayload.milkCapacity = updatePayload.milkCapacity !== null && updatePayload.milkCapacity !== undefined && updatePayload.milkCapacity !== '' 
        ? String(updatePayload.milkCapacity) 
        : '';
    }

    const updatedListing = await listingService.updateListing(req.params.id, updatePayload);
    res.json(updatedListing);
  } catch (err) {
    console.error('Error updating listing:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/listings/:id
// @desc    Delete a listing
// @access  Private (Vendor only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await listingService.getListingById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    // Delete associated files from GridFS database storage
    if (listing.media && listing.media.length > 0) {
      for (const item of listing.media) {
        if (item.public_id) {
          await uploadRouter.deleteFileFromGridFS(item.public_id);
        }
      }
    }

    // Delete associated voice note from GridFS
    if (listing.voiceDescription) {
      const parts = listing.voiceDescription.split('/');
      const voiceFileId = parts[parts.length - 1];
      if (voiceFileId) {
        await uploadRouter.deleteFileFromGridFS(voiceFileId);
      }
    }

    await listingService.deleteListing(req.params.id);
    res.json({ message: 'Listing deleted successfully' });
  } catch (err) {
    console.error('Error deleting listing:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
