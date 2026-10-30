'use strict';

const {
  sequelize, State, District, City, PostalCode, User, Event
} = require('../models');

const INDIAN_STATES_AND_UTS = [
  // 28 States
  { name: 'Andhra Pradesh', code: 'AP', type: 'State' },
  { name: 'Arunachal Pradesh', code: 'AR', type: 'State' },
  { name: 'Assam', code: 'AS', type: 'State' },
  { name: 'Bihar', code: 'BR', type: 'State' },
  { name: 'Chhattisgarh', code: 'CG', type: 'State' },
  { name: 'Goa', code: 'GA', type: 'State' },
  { name: 'Gujarat', code: 'GJ', type: 'State' },
  { name: 'Haryana', code: 'HR', type: 'State' },
  { name: 'Himachal Pradesh', code: 'HP', type: 'State' },
  { name: 'Jharkhand', code: 'JH', type: 'State' },
  { name: 'Karnataka', code: 'KA', type: 'State' },
  { name: 'Kerala', code: 'KL', type: 'State' },
  { name: 'Madhya Pradesh', code: 'MP', type: 'State' },
  { name: 'Maharashtra', code: 'MH', type: 'State' },
  { name: 'Manipur', code: 'MN', type: 'State' },
  { name: 'Meghalaya', code: 'ML', type: 'State' },
  { name: 'Mizoram', code: 'MZ', type: 'State' },
  { name: 'Nagaland', code: 'NL', type: 'State' },
  { name: 'Odisha', code: 'OD', type: 'State' },
  { name: 'Punjab', code: 'PB', type: 'State' },
  { name: 'Rajasthan', code: 'RJ', type: 'State' },
  { name: 'Sikkim', code: 'SK', type: 'State' },
  { name: 'Tamil Nadu', code: 'TN', type: 'State' },
  { name: 'Telangana', code: 'TS', type: 'State' },
  { name: 'Tripura', code: 'TR', type: 'State' },
  { name: 'Uttar Pradesh', code: 'UP', type: 'State' },
  { name: 'Uttarakhand', code: 'UK', type: 'State' },
  { name: 'West Bengal', code: 'WB', type: 'State' },
  // 8 Union Territories
  { name: 'Andaman and Nicobar Islands', code: 'AN', type: 'Union Territory' },
  { name: 'Chandigarh', code: 'CH', type: 'Union Territory' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH', type: 'Union Territory' },
  { name: 'Delhi', code: 'DL', type: 'Union Territory' },
  { name: 'Jammu and Kashmir', code: 'JK', type: 'Union Territory' },
  { name: 'Ladakh', code: 'LA', type: 'Union Territory' },
  { name: 'Lakshadweep', code: 'LD', type: 'Union Territory' },
  { name: 'Puducherry', code: 'PY', type: 'Union Territory' },
];

const GEOGRAPHY_DATA = [
  {
    state: 'Gujarat',
    districts: [
      {
        name: 'Gandhinagar',
        cities: [
          { name: 'Gandhinagar', popular: true },
          { name: 'Koba', popular: true }, // Explicitly classified under Gandhinagar!
          { name: 'Adalaj', popular: true },
          { name: 'Kudasan', popular: false },
          { name: 'Infocity', popular: false },
          { name: 'Mansa', popular: false },
          { name: 'Kalol', popular: false }
        ],
        pincodes: [
          { pincode: '382007', locality: 'Koba Circle / Koba Village', po: 'Koba SO', city: 'Koba' },
          { pincode: '382421', locality: 'Kudasan / Infocity / PDPU', po: 'Kudasan BO', city: 'Kudasan' },
          { pincode: '382428', locality: 'Adalaj Stepwell / Trimandir', po: 'Adalaj SO', city: 'Adalaj' },
          { pincode: '382010', locality: 'Sector 10 / Vidhan Sabha', po: 'Gandhinagar HO', city: 'Gandhinagar' },
          { pincode: '382016', locality: 'Sector 16 / GIDC', po: 'Sector 16 SO', city: 'Gandhinagar' }
        ]
      },
      {
        name: 'Ahmedabad',
        cities: [
          { name: 'Ahmedabad', popular: true },
          { name: 'Navrangpura', popular: true },
          { name: 'Vastrapur', popular: true },
          { name: 'Bodakdev', popular: false },
          { name: 'Maninagar', popular: false },
          { name: 'Satellite', popular: false },
          { name: 'Paldi', popular: false },
          { name: 'Sanand', popular: false }
        ],
        pincodes: [
          { pincode: '380009', locality: 'Navrangpura / Riverfront West', po: 'Navrangpura HO', city: 'Ahmedabad' },
          { pincode: '380015', locality: 'Vastrapur / IIM Ahmedabad', po: 'Vastrapur SO', city: 'Ahmedabad' },
          { pincode: '380054', locality: 'Bodakdev / SG Highway', po: 'Bodakdev SO', city: 'Ahmedabad' },
          { pincode: '380008', locality: 'Maninagar / Kankaria Lake', po: 'Maninagar HO', city: 'Ahmedabad' },
          { pincode: '380001', locality: 'Bhadra / Old City / Lal Darwaja', po: 'Ahmedabad GPO', city: 'Ahmedabad' }
        ]
      },
      {
        name: 'Surat',
        cities: [
          { name: 'Surat', popular: true },
          { name: 'Vesu', popular: true },
          { name: 'Adajan', popular: true },
          { name: 'Athwa', popular: false },
          { name: 'Varachha', popular: false },
          { name: 'Katargam', popular: false }
        ],
        pincodes: [
          { pincode: '395007', locality: 'Vesu / Dumas Road', po: 'SVNIT SO', city: 'Surat' },
          { pincode: '395009', locality: 'Adajan / Pal', po: 'Adajan Dn SO', city: 'Surat' },
          { pincode: '395001', locality: 'Athwagate / Nanpura', po: 'Surat HO', city: 'Surat' },
          { pincode: '395006', locality: 'Varachha / Mini Bazar', po: 'Varachha SO', city: 'Surat' }
        ]
      },
      {
        name: 'Vadodara',
        cities: [
          { name: 'Vadodara', popular: true },
          { name: 'Alkapuri', popular: false },
          { name: 'Sayajigunj', popular: false }
        ],
        pincodes: [
          { pincode: '390001', locality: 'Sayajigunj / Station', po: 'Vadodara HO', city: 'Vadodara' },
          { pincode: '390007', locality: 'Alkapuri / Race Course', po: 'Alkapuri SO', city: 'Vadodara' }
        ]
      },
      {
        name: 'Rajkot',
        cities: [{ name: 'Rajkot', popular: true }],
        pincodes: [{ pincode: '360001', locality: 'Dharmendrasinhji Road', po: 'Rajkot HO', city: 'Rajkot' }]
      }
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      {
        name: 'Mumbai Suburban',
        cities: [
          { name: 'Mumbai', popular: true },
          { name: 'Andheri', popular: true },
          { name: 'Bandra', popular: true },
          { name: 'Juhu', popular: false },
          { name: 'Borivali', popular: false },
          { name: 'Goregaon', popular: false }
        ],
        pincodes: [
          { pincode: '400058', locality: 'Andheri West / Lokhandwala', po: 'Andheri West SO', city: 'Mumbai' },
          { pincode: '400050', locality: 'Bandra West / Bandstand', po: 'Bandra West SO', city: 'Mumbai' },
          { pincode: '400049', locality: 'Juhu / Tara Road', po: 'Juhu SO', city: 'Mumbai' },
          { pincode: '400092', locality: 'Borivali West / Shimpoli', po: 'Borivali West SO', city: 'Mumbai' }
        ]
      },
      {
        name: 'Mumbai City',
        cities: [
          { name: 'Mumbai', popular: true },
          { name: 'Colaba', popular: false },
          { name: 'Marine Lines', popular: false },
          { name: 'Fort', popular: false }
        ],
        pincodes: [
          { pincode: '400001', locality: 'Fort / Nariman Point', po: 'Mumbai GPO', city: 'Mumbai' },
          { pincode: '400005', locality: 'Colaba / Cuffe Parade', po: 'Colaba SO', city: 'Mumbai' }
        ]
      },
      {
        name: 'Pune',
        cities: [
          { name: 'Pune', popular: true },
          { name: 'Kothrud', popular: false },
          { name: 'Baner', popular: false },
          { name: 'Hinjewadi', popular: false },
          { name: 'Viman Nagar', popular: false }
        ],
        pincodes: [
          { pincode: '411001', locality: 'Camp / Pune Station', po: 'Pune HO', city: 'Pune' },
          { pincode: '411038', locality: 'Kothrud / Paud Road', po: 'Kothrud SO', city: 'Pune' },
          { pincode: '411045', locality: 'Baner / Balewadi High Street', po: 'Baner Road SO', city: 'Pune' },
          { pincode: '411057', locality: 'Hinjewadi IT Park / Phase 1', po: 'Infotech Park SO', city: 'Pune' }
        ]
      },
      {
        name: 'Thane',
        cities: [{ name: 'Thane', popular: true }, { name: 'Navi Mumbai', popular: true }],
        pincodes: [{ pincode: '400601', locality: 'Thane West / Panch Pakhadi', po: 'Thane HO', city: 'Thane' }]
      }
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      {
        name: 'Bengaluru Urban',
        cities: [
          { name: 'Bengaluru', popular: true },
          { name: 'Koramangala', popular: false },
          { name: 'Indiranagar', popular: false },
          { name: 'Whitefield', popular: false },
          { name: 'HSR Layout', popular: false }
        ],
        pincodes: [
          { pincode: '560001', locality: 'MG Road / Cubbon Park', po: 'Bangalore GPO', city: 'Bengaluru' },
          { pincode: '560034', locality: 'Koramangala 4th Block', po: 'Koramangala SO', city: 'Bengaluru' },
          { pincode: '560038', locality: 'Indiranagar 100ft Road', po: 'Indiranagar SO', city: 'Bengaluru' },
          { pincode: '560066', locality: 'Whitefield Main Road', po: 'Whitefield SO', city: 'Bengaluru' }
        ]
      },
      {
        name: 'Mysuru',
        cities: [{ name: 'Mysuru', popular: true }],
        pincodes: [{ pincode: '570001', locality: 'Mysore Palace / Sayyaji Rao Rd', po: 'Mysore HO', city: 'Mysuru' }]
      }
    ]
  },
  {
    state: 'Delhi',
    districts: [
      {
        name: 'New Delhi',
        cities: [{ name: 'Delhi', popular: true }, { name: 'Connaught Place', popular: false }],
        pincodes: [{ pincode: '110001', locality: 'Connaught Place / Janpath', po: 'New Delhi GPO', city: 'Delhi' }]
      },
      {
        name: 'South Delhi',
        cities: [{ name: 'Delhi', popular: true }, { name: 'Hauz Khas', popular: false }],
        pincodes: [{ pincode: '110016', locality: 'Hauz Khas / Green Park', po: 'Hauz Khas SO', city: 'Delhi' }]
      }
    ]
  },
  {
    state: 'Telangana',
    districts: [
      {
        name: 'Hyderabad',
        cities: [
          { name: 'Hyderabad', popular: true },
          { name: 'Hitec City', popular: false },
          { name: 'Banjara Hills', popular: false }
        ],
        pincodes: [
          { pincode: '500001', locality: 'Abids / Koti', po: 'Hyderabad GPO', city: 'Hyderabad' },
          { pincode: '500081', locality: 'Hitec City / Madhapur', po: 'Madhapur SO', city: 'Hyderabad' }
        ]
      }
    ]
  },
  {
    state: 'Tamil Nadu',
    districts: [
      {
        name: 'Chennai',
        cities: [{ name: 'Chennai', popular: true }, { name: 'T Nagar', popular: false }],
        pincodes: [{ pincode: '600001', locality: 'Parrys / Marina', po: 'Chennai GPO', city: 'Chennai' }]
      }
    ]
  },
  {
    state: 'Rajasthan',
    districts: [
      {
        name: 'Jaipur',
        cities: [{ name: 'Jaipur', popular: true }],
        pincodes: [{ pincode: '302001', locality: 'MI Road / C Scheme', po: 'Jaipur GPO', city: 'Jaipur' }]
      }
    ]
  },
  {
    state: 'West Bengal',
    districts: [
      {
        name: 'Kolkata',
        cities: [{ name: 'Kolkata', popular: true }, { name: 'Park Street', popular: false }],
        pincodes: [{ pincode: '700001', locality: 'BBD Bagh / Esplanade', po: 'Kolkata GPO', city: 'Kolkata' }]
      }
    ]
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      {
        name: 'Lucknow',
        cities: [{ name: 'Lucknow', popular: true }, { name: 'Gomti Nagar', popular: false }],
        pincodes: [{ pincode: '226001', locality: 'Hazratganj', po: 'Lucknow GPO', city: 'Lucknow' }]
      }
    ]
  },
  {
    state: 'Assam',
    districts: [
      {
        name: 'Kamrup Metropolitan',
        cities: [{ name: 'Guwahati', popular: true }],
        pincodes: [{ pincode: '781001', locality: 'Panbazar / Fancy Bazar', po: 'Guwahati GPO', city: 'Guwahati' }]
      }
    ]
  },
  {
    state: 'Manipur',
    districts: [
      {
        name: 'Imphal West',
        cities: [{ name: 'Imphal', popular: true }],
        pincodes: [{ pincode: '795001', locality: 'Imphal Main Market', po: 'Imphal HO', city: 'Imphal' }]
      }
    ]
  },
  {
    state: 'Ladakh',
    districts: [
      {
        name: 'Leh',
        cities: [{ name: 'Leh', popular: true }],
        pincodes: [{ pincode: '194101', locality: 'Main Bazaar', po: 'Leh HO', city: 'Leh' }]
      }
    ]
  },
  {
    state: 'Lakshadweep',
    districts: [
      {
        name: 'Lakshadweep',
        cities: [{ name: 'Kavaratti', popular: true }],
        pincodes: [{ pincode: '682555', locality: 'Kavaratti Island', po: 'Kavaratti SO', city: 'Kavaratti' }]
      }
    ]
  },
  {
    state: 'Andaman and Nicobar Islands',
    districts: [
      {
        name: 'South Andaman',
        cities: [{ name: 'Port Blair', popular: true }],
        pincodes: [{ pincode: '744101', locality: 'Aberdeen Bazaar', po: 'Port Blair HO', city: 'Port Blair' }]
      }
    ]
  },
  {
    state: 'Kerala',
    districts: [
      {
        name: 'Ernakulam',
        cities: [
          { name: 'Kochi', popular: true },
          { name: 'Fort Kochi', popular: true },
          { name: 'Marine Drive', popular: false },
          { name: 'Kakkanad', popular: false }
        ],
        pincodes: [
          { pincode: '682001', locality: 'Fort Kochi Beach / Chinese Nets', po: 'Fort Kochi SO', city: 'Kochi' },
          { pincode: '682031', locality: 'Marine Drive Promenade / Shanmugham Rd', po: 'Ernakulam Head SO', city: 'Kochi' },
          { pincode: '682030', locality: 'Kakkanad Infopark', po: 'Kakkanad SO', city: 'Kochi' }
        ]
      }
    ]
  }
];

async function seed() {
  console.log('🚀 Synchronizing MySQL database tables...');
  await sequelize.sync({ alter: true });
  console.log('✅ Tables altered & synchronized.');

  console.log('🇮🇳 Seeding 28 States and 8 Union Territories...');
  const stateMap = new Map();
  for (const s of INDIAN_STATES_AND_UTS) {
    const [record] = await State.findOrCreate({
      where: { state_name: s.name },
      defaults: { state_name: s.name, state_code: s.code, type: s.type }
    });
    stateMap.set(s.name, record.state_id);
  }
  console.log(`✅ Seeded ${stateMap.size} Indian States & UTs.`);

  console.log('🏙️ Seeding Districts, Cities, and PostalCodes reference data...');
  let districtCount = 0;
  let cityCount = 0;
  let pincodeCount = 0;

  for (const item of GEOGRAPHY_DATA) {
    const stateId = stateMap.get(item.state);
    if (!stateId) continue;

    for (const d of item.districts) {
      const [districtRec] = await District.findOrCreate({
        where: { state_id: stateId, district_name: d.name },
        defaults: { state_id: stateId, district_name: d.name }
      });
      districtCount++;

      const cityMap = new Map();
      for (const c of d.cities) {
        const [cityRec] = await City.findOrCreate({
          where: { district_id: districtRec.district_id, city_name: c.name },
          defaults: { district_id: districtRec.district_id, city_name: c.name, is_popular: c.popular }
        });
        cityMap.set(c.name, cityRec.city_id);
        cityCount++;
      }

      for (const p of d.pincodes) {
        const cityId = cityMap.get(p.city) || null;
        await PostalCode.findOrCreate({
          where: { pincode: p.pincode, district_id: districtRec.district_id },
          defaults: {
            pincode: p.pincode,
            state_id: stateId,
            district_id: districtRec.district_id,
            city_id: cityId,
            post_office_name: p.po,
            locality_name: p.locality
          }
        });
        pincodeCount++;
      }
    }
  }

  console.log(`✅ Seeded ${districtCount} Districts, ${cityCount} Cities/Towns, and ${pincodeCount} Postal Codes.`);
  console.log('🎉 All-India Location Database synchronization completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
