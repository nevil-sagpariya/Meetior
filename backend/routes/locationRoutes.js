'use strict';

const express = require('express');
const router = express.Router();
const {
  getStates,
  getDistricts,
  getCities,
  lookupPincode,
  getDiscoveryCities,
  searchLocations,
  resolveLocation
} = require('../controllers/locationController');

router.get('/states', getStates);
router.get('/districts', getDistricts);
router.get('/cities', getCities);
router.get('/pincode/:pincode', lookupPincode);
router.get('/discovery-cities', getDiscoveryCities);
router.get('/search', searchLocations);
router.get('/resolve', resolveLocation);

module.exports = router;
