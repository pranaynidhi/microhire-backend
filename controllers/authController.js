const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      role,
      bio,
      skills,
      companyName,
      contactPerson,
      companyDescription,
      website,
      phone,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // Validate role-specific fields
    if (role === 'business' && !companyName) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required for business accounts.',
      });
    }

    // Create user
    const userData = {
      fullName,
      email,
      password,
      role,
    };

    if (role === 'student') {
      userData.bio = bio;
      userData.skills = skills;
    } else if (role === 'business') {
      userData.companyName = companyName;
      userData.contactPerson = contactPerson;
      userData.companyDescription = companyDescription;
      userData.website = website;
      userData.phone = phone;
    }

    const user = await User.create(userData);
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error.',
        errors: error.errors.map((err) => ({
          field: err.path,
          message: err.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.getPublicProfile(),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

module.exports = {
  register,
  login,
};
