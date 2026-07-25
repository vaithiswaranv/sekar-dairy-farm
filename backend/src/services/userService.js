const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '../../data');
const FILE_PATH = path.join(DATA_DIR, 'users.json');

// Ensure data directory and file exist
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

// Read from JSON file
const readFromFile = () => {
  initFileStorage();
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
};

// Write to JSON file
const writeToFile = (data) => {
  initFileStorage();
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing users file:', err);
  }
};

const findUserByUsername = async (username) => {
  if (isMongoConnected()) {
    return await User.findOne({ username });
  } else {
    const users = readFromFile();
    return users.find(u => u.username === username) || null;
  }
};

const createUser = async (username, password, role = 'vendor') => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  if (isMongoConnected()) {
    const newUser = new User({
      username,
      password: hashedPassword,
      role
    });
    return await newUser.save();
  } else {
    const users = readFromFile();
    const newUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      username,
      password: hashedPassword,
      role,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeToFile(users);
    return newUser;
  }
};

// Seed default vendor if database is empty
const seedDefaultUser = async () => {
  const defaultUsername = process.env.ADMIN_USERNAME || 'sekar';
  const defaultPassword = process.env.ADMIN_PASSWORD || 'farm123';
  
  try {
    const existingUser = await findUserByUsername(defaultUsername);
    if (!existingUser) {
      await createUser(defaultUsername, defaultPassword, 'admin');
      console.log(`👤 Default admin user created! Username: ${defaultUsername}, Password: ${defaultPassword}`);
    }
  } catch (err) {
    console.error('Failed to seed default admin user:', err);
  }
};

module.exports = {
  findUserByUsername,
  createUser,
  seedDefaultUser
};
