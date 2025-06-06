const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

let firebaseAdmin = null;

const initializeFirebase = () => {
  try {
    if (!firebaseAdmin) {
      // Load service account key from file
      const serviceAccount = require('../../serviceAccountKey.json');
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      
      logger.info('Firebase initialized successfully');
    }
    return firebaseAdmin;
  } catch (error) {
    logger.error('Error initializing Firebase:', error);
    throw error;
  }
};

const getFirebaseAdmin = () => {
  if (!firebaseAdmin) {
    return initializeFirebase();
  }
  return firebaseAdmin;
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await getFirebaseAdmin().auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Error verifying Firebase ID token:', error);
    throw error;
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await getFirebaseAdmin().auth().getUser(uid);
    return userRecord;
  } catch (error) {
    logger.error('Error getting user by UID:', error);
    throw error;
  }
};

// Create custom token
const createCustomToken = async (uid, claims = {}) => {
  try {
    const customToken = await getFirebaseAdmin().auth().createCustomToken(uid, claims);
    return customToken;
  } catch (error) {
    logger.error('Error creating custom token:', error);
    throw error;
  }
};

// Update user claims
const updateUserClaims = async (uid, claims) => {
  try {
    await getFirebaseAdmin().auth().setCustomUserClaims(uid, claims);
    logger.info(`Updated claims for user ${uid}`);
  } catch (error) {
    logger.error('Error updating user claims:', error);
    throw error;
  }
};

// Delete user
const deleteUser = async (uid) => {
  try {
    await getFirebaseAdmin().auth().deleteUser(uid);
    logger.info(`Deleted user ${uid}`);
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

module.exports = {
  getFirebaseAdmin,
  verifyIdToken,
  getUserByUid,
  createCustomToken,
  updateUserClaims,
  deleteUser
}; 