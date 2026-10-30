'use strict';

const { Op } = require('sequelize');
const { State, District, City, PostalCode, Location } = require('../models');

// GET /api/locations/states
// Returns all 28 Indian States & 8 Union Territories
const getStates = async (_req, res) => {
  try {
    const states = await State.findAll({
      order: [['type', 'ASC'], ['state_name', 'ASC']],
      attributes: ['state_id', 'state_name', 'state_code', 'type']
    });
    return res.json({ success: true, count: states.length, states });
  } catch (err) {
    console.error('getStates error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch states' });
  }
};

// GET /api/locations/districts?state_id=X&state_name=Y
const getDistricts = async (req, res) => {
  try {
    const { state_id, state_name } = req.query;
    let whereClause = {};

    if (state_id) {
      whereClause.state_id = parseInt(state_id);
    } else if (state_name) {
      const state = await State.findOne({ where: { state_name } });
      if (state) whereClause.state_id = state.state_id;
    }

    const districts = await District.findAll({
      where: whereClause,
      include: [{ model: State, as: 'state', attributes: ['state_name', 'state_code'] }],
      order: [['district_name', 'ASC']]
    });

    return res.json({ success: true, count: districts.length, districts });
  } catch (err) {
    console.error('getDistricts error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch districts' });
  }
};

// GET /api/locations/cities?district_id=X&state_id=Y
const getCities = async (req, res) => {
  try {
    const { district_id, state_id, search } = req.query;
    let whereClause = {};

    if (district_id) {
      whereClause.district_id = parseInt(district_id);
    }

    if (search) {
      whereClause.city_name = { [Op.like]: `%${search.trim()}%` };
    }

    const include = [{
      model: District,
      as: 'district',
      include: [{ model: State, as: 'state', attributes: ['state_name', 'state_code'] }]
    }];

    if (state_id) {
      include[0].where = { state_id: parseInt(state_id) };
    }

    const cities = await City.findAll({
      where: whereClause,
      include,
      order: [['is_popular', 'DESC'], ['city_name', 'ASC']]
    });

    return res.json({ success: true, count: cities.length, cities });
  } catch (err) {
    console.error('getCities error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch cities' });
  }
};

// GET /api/locations/pincode/:pincode
// Instant lookup of local 6-digit Indian PIN code
const lookupPincode = async (req, res) => {
  try {
    const pincode = String(req.params.pincode || '').trim();
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit Indian PIN code.'
      });
    }

    const records = await PostalCode.findAll({
      where: { pincode },
      include: [
        { model: State, as: 'state', attributes: ['state_id', 'state_name', 'state_code'] },
        { model: District, as: 'district', attributes: ['district_id', 'district_name'] },
        { model: City, as: 'city', attributes: ['city_id', 'city_name'] }
      ]
    });

    if (!records || records.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No postal records found locally for PIN code ${pincode}. You may enter location manually.`
      });
    }

    // Prepare primary suggestion and alternatives if multiple localities exist
    const primary = records[0];
    const localities = records.map(r => r.locality_name || r.post_office_name).filter(Boolean);
    const resolvedStateName = primary.state?.state_name || '';
    const resolvedStateCode = primary.state?.state_code || '';
    const resolvedDistrictName = primary.district?.district_name || '';
    const resolvedCityName = primary.city?.city_name || primary.locality_name || primary.district?.district_name || '';

    return res.json({
      success: true,
      pincode,
      state: resolvedStateName,
      state_code: resolvedStateCode,
      district: resolvedDistrictName,
      city: resolvedCityName,
      post_office: primary.post_office_name || '',
      localities: [...new Set(localities)],
      postal_code: {
        pincode,
        state: resolvedStateName,
        state_code: resolvedStateCode,
        district: resolvedDistrictName,
        city: resolvedCityName,
        post_office: primary.post_office_name || '',
        localities: [...new Set(localities)]
      },
      all_matches: records.map(r => ({
        locality: r.locality_name,
        post_office: r.post_office_name,
        city: r.city?.city_name,
        district: r.district?.district_name,
        state: r.state?.state_name
      }))
    });
  } catch (err) {
    console.error('lookupPincode error:', err);
    return res.status(500).json({ success: false, message: 'Could not lookup PIN code' });
  }
};

// GET /api/locations/discovery-cities
// Returns curated popular cities + distinct active event cities across India
const getDiscoveryCities = async (_req, res) => {
  try {
    const popularCities = [
      'Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot',
      'Mumbai', 'Pune', 'Thane', 'Navi Mumbai',
      'Bengaluru', 'Mysuru',
      'Delhi', 'Noida', 'Gurugram',
      'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur', 'Lucknow'
    ];

    // Also include any cities currently hosting events in MySQL
    const activeLocationCities = await Location.findAll({
      attributes: ['city'],
      group: ['city']
    });

    const activeList = activeLocationCities.map(l => l.city).filter(Boolean);
    const combined = [...new Set([...popularCities, ...activeList])].sort();

    return res.json({
      success: true,
      cities: combined,
      default: 'Ahmedabad'
    });
  } catch (err) {
    console.error('getDiscoveryCities error:', err);
    return res.status(500).json({ success: false, message: 'Could not fetch discovery cities' });
  }
};

// GET /api/locations/search?q=query
// Local search across cities, districts, localities, and postal codes
const searchLocations = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({ success: true, suggestions: [] });
    }

    // 1. Check PostalCodes by pincode or locality
    const pcMatches = await PostalCode.findAll({
      where: {
        [Op.or]: [
          { pincode: { [Op.like]: `${q}%` } },
          { locality_name: { [Op.like]: `%${q}%` } },
          { post_office_name: { [Op.like]: `%${q}%` } }
        ]
      },
      include: [
        { model: State, as: 'state', attributes: ['state_name'] },
        { model: District, as: 'district', attributes: ['district_name'] },
        { model: City, as: 'city', attributes: ['city_name'] }
      ],
      limit: 8
    });

    // 2. Check Cities
    const cityMatches = await City.findAll({
      where: { city_name: { [Op.like]: `%${q}%` } },
      include: [{
        model: District,
        as: 'district',
        include: [{ model: State, as: 'state', attributes: ['state_name'] }]
      }],
      limit: 6
    });

    const suggestions = [];

    // Format city matches
    cityMatches.forEach(c => {
      suggestions.push({
        id: `city_${c.city_id}`,
        title: c.city_name,
        subtitle: `${c.district?.district_name}, ${c.district?.state?.state_name}, India`,
        city: c.city_name,
        district: c.district?.district_name,
        state: c.district?.state?.state_name,
        type: 'city'
      });
    });

    // Format postal code matches
    pcMatches.forEach(p => {
      const label = p.locality_name || p.post_office_name || p.city?.city_name || 'Locality';
      suggestions.push({
        id: `pc_${p.postal_code_id}`,
        title: `${label} (${p.pincode})`,
        subtitle: `${p.district?.district_name}, ${p.state?.state_name}, India`,
        city: p.city?.city_name || label,
        district: p.district?.district_name,
        state: p.state?.state_name,
        pincode: p.pincode,
        type: 'pincode'
      });
    });

    return res.json({ success: true, suggestions });
  } catch (err) {
    console.error('searchLocations error:', err);
    return res.status(500).json({ success: false, message: 'Location search failed' });
  }
};

// GET /api/locations/resolve?q=location_text&city=optional&district=optional
// Strictly resolves administrative hierarchy without external Google APIs
const resolveLocation = async (req, res) => {
  try {
    const targetText = (req.query.q || req.query.venue_name || '').trim();
    const inputCity = (req.query.city || '').trim();
    const inputDistrict = (req.query.district || '').trim();
    const inputState = (req.query.state || '').trim();
    const inputPincode = (req.query.pincode || '').trim();

    let resolvedState = inputState || 'Gujarat';
    let resolvedDistrict = inputDistrict || inputCity || 'Ahmedabad';
    let resolvedCity = inputCity || 'Ahmedabad';
    let resolvedPincode = inputPincode || null;
    let resolvedLocality = targetText;

    const lowerTarget = targetText.toLowerCase();

    // Critical Administrative Rule: Koba must ALWAYS be in Gandhinagar District!
    if (lowerTarget.includes('koba') || resolvedCity.toLowerCase() === 'koba') {
      resolvedCity = 'Koba';
      resolvedDistrict = 'Gandhinagar';
      resolvedState = 'Gujarat';
      resolvedPincode = resolvedPincode || '382007';
    } else if (lowerTarget.includes('adalaj') || resolvedCity.toLowerCase() === 'adalaj') {
      resolvedCity = 'Adalaj';
      resolvedDistrict = 'Gandhinagar';
      resolvedState = 'Gujarat';
      resolvedPincode = resolvedPincode || '382428';
    } else if (lowerTarget.includes('surat') || resolvedCity.toLowerCase() === 'surat') {
      resolvedCity = 'Surat';
      resolvedDistrict = 'Surat';
      resolvedState = 'Gujarat';
    } else if (lowerTarget.includes('mumbai') || resolvedCity.toLowerCase() === 'mumbai') {
      resolvedCity = 'Mumbai';
      resolvedDistrict = 'Mumbai Suburban';
      resolvedState = 'Maharashtra';
    } else if (inputPincode && /^\d{6}$/.test(inputPincode)) {
      const pc = await PostalCode.findOne({
        where: { pincode: inputPincode },
        include: [
          { model: State, as: 'state' },
          { model: District, as: 'district' },
          { model: City, as: 'city' }
        ]
      });
      if (pc) {
        resolvedState = pc.state?.state_name || resolvedState;
        resolvedDistrict = pc.district?.district_name || resolvedDistrict;
        resolvedCity = pc.city?.city_name || resolvedCity;
      }
    }

    return res.json({
      success: true,
      resolved: {
        venue_name: targetText || resolvedCity,
        formatted_address: `${targetText ? targetText + ', ' : ''}${resolvedCity}, ${resolvedDistrict}, ${resolvedState}, India`,
        locality: resolvedLocality,
        city: resolvedCity,
        district: resolvedDistrict,
        state: resolvedState,
        postal_code: resolvedPincode,
        country_code: 'IN',
        discovery_city: (resolvedDistrict === 'Gandhinagar' || resolvedCity === 'Koba' || resolvedCity === 'Adalaj') ? 'Gandhinagar' : resolvedCity
      }
    });
  } catch (err) {
    console.error('resolveLocation error:', err);
    return res.status(500).json({ success: false, message: 'Could not resolve location' });
  }
};

module.exports = {
  getStates,
  getDistricts,
  getCities,
  lookupPincode,
  getDiscoveryCities,
  searchLocations,
  resolveLocation
};
