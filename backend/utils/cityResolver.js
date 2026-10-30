'use strict';

const CANONICAL_MAP = {
  // Gujarat
  'ahemdabad': 'Ahmedabad',
  'ahmadabad': 'Ahmedabad',
  'amdavad': 'Ahmedabad',
  'ahmedabad': 'Ahmedabad',
  'karnavati': 'Ahmedabad',
  'baroda': 'Vadodara',
  'vadodara': 'Vadodara',
  'surat': 'Surat',
  'gandhinagar': 'Gandhinagar',
  'rajkot': 'Rajkot',

  // Maharashtra
  'bombay': 'Mumbai',
  'mumbai': 'Mumbai',
  'navi mumbai': 'Navi Mumbai',
  'poona': 'Pune',
  'pune': 'Pune',
  'nagpur': 'Nagpur',
  'nashik': 'Nashik',
  'nasik': 'Nashik',
  'thane': 'Thane',

  // Karnataka
  'bangalore': 'Bengaluru',
  'bengaluru': 'Bengaluru',
  'mysore': 'Mysuru',
  'mysuru': 'Mysuru',
  'mangalore': 'Mangaluru',
  'mangaluru': 'Mangaluru',
  'belgaum': 'Belagavi',
  'belagavi': 'Belagavi',
  'hubli': 'Hubballi',
  'hubballi': 'Hubballi',
  'gulbarga': 'Kalaburagi',
  'kalaburagi': 'Kalaburagi',

  // Tamil Nadu
  'madras': 'Chennai',
  'chennai': 'Chennai',
  'coimbatore': 'Coimbatore',
  'madurai': 'Madurai',

  // West Bengal
  'calcutta': 'Kolkata',
  'kolkata': 'Kolkata',

  // Delhi NCR
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
  'gurgaon': 'Gurugram',
  'gurugram': 'Gurugram',
  'noida': 'Noida',
  'faridabad': 'Faridabad',
  'ghaziabad': 'Ghaziabad',

  // Uttar Pradesh
  'allahabad': 'Prayagraj',
  'prayagraj': 'Prayagraj',
  'banaras': 'Varanasi',
  'benares': 'Varanasi',
  'kashi': 'Varanasi',
  'varanasi': 'Varanasi',
  'lucknow': 'Lucknow',
  'kanpur': 'Kanpur',

  // Kerala
  'cochin': 'Kochi',
  'kochi': 'Kochi',
  'trivandrum': 'Thiruvananthapuram',
  'thiruvananthapuram': 'Thiruvananthapuram',
  'calicut': 'Kozhikode',
  'kozhikode': 'Kozhikode',

  // Andhra Pradesh / Telangana
  'hyderabad': 'Hyderabad',
  'vizag': 'Visakhapatnam',
  'visakhapatnam': 'Visakhapatnam',

  // Goa
  'panjim': 'Panaji',
  'panaji': 'Panaji',

  // Others
  'pondicherry': 'Puducherry',
  'puducherry': 'Puducherry',
  'simla': 'Shimla',
  'shimla': 'Shimla',
  'gauhati': 'Guwahati',
  'guwahati': 'Guwahati',
  'bhubaneshwar': 'Bhubaneswar',
  'bhubaneswar': 'Bhubaneswar',
};

function resolveCanonicalCity(city) {
  if (!city || typeof city !== 'string') return '';
  const trimmed = city.trim();
  const lower = trimmed.toLowerCase();
  if (CANONICAL_MAP[lower]) {
    return CANONICAL_MAP[lower];
  }
  return trimmed;
}

module.exports = {
  resolveCanonicalCity,
  CANONICAL_MAP,
};
