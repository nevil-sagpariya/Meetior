'use strict';

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.DB_NAME || 'meetior_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT) || 3306;

// Passwords to attempt
const CANDIDATE_PASSWORDS = [
  process.env.DB_PASSWORD,
  'Nevil@90',
  'Nevil@99',
  '',
  'root'
].filter((v, idx, arr) => arr.indexOf(v) === idx);

async function findWorkingConnection() {
  for (const pwd of CANDIDATE_PASSWORDS) {
    try {
      const conn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: pwd
      });
      console.log(`✅ MySQL authentication succeeded with password: "${pwd ? '***' : '(empty)'}"`);
      return { conn, workingPassword: pwd };
    } catch (err) {
      // try next
    }
  }
  throw new Error(`Could not authenticate with any candidate password. Please ensure MySQL is running on port ${DB_PORT}.`);
}

async function seedDatabase() {
  console.log('🌱 Starting Meetior Database Seeder...');

  // 1. Connect without DB selected to ensure DB exists
  const { conn, workingPassword } = await findWorkingConnection();
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log(`✅ Database \`${DB_NAME}\` is verified.`);
  await conn.end();

  // Update .env if the working password differed
  if (process.env.DB_PASSWORD !== workingPassword) {
    process.env.DB_PASSWORD = workingPassword;
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${workingPassword}`);
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env with working MySQL password.');
    }
  }

  // 2. Initialize Sequelize with working password
  const {
    sequelize,
    User,
    Category,
    Location,
    Event,
    EventImage,
    EventInteraction,
    EventRegistration,
    EventTicket,
    SecondChanceRequest,
    SecondChanceResponse,
    EventDemand,
    DemandSupporter,
    Notification
  } = require('../models');

  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('✅ All tables synchronized with Sequelize.');

  // 3. Seed Categories
  const categoriesData = [
    { name: 'Music & Nightlife', slug: 'Music', icon: '🎵' },
    { name: 'Food & Festivals', slug: 'Food', icon: '🍲' },
    { name: 'Art & Workshops', slug: 'Art', icon: '🎨' },
    { name: 'Heritage & History', slug: 'Heritage', icon: '🏛️' },
    { name: 'Sports & Outdoors', slug: 'Outdoors', icon: '🏃' },
    { name: 'Carnival & Fun', slug: 'Carnival', icon: '🎪' },
    { name: 'Community & Meetups', slug: 'Community', icon: '🤝' },
    { name: 'Technology & Education', slug: 'Technology', icon: '💻' },
    { name: 'Other', slug: 'Other', icon: '✨' }
  ];

  for (const cat of categoriesData) {
    await Category.findOrCreate({
      where: { slug: cat.slug },
      defaults: cat
    });
  }
  console.log(`✅ Seeded ${categoriesData.length} categories.`);

  // 4. Seed Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Meetior2026', salt);

  const [organizer] = await User.findOrCreate({
    where: { email: 'organizer@meetior.in' },
    defaults: {
      name: 'Aarav Patel',
      email: 'organizer@meetior.in',
      password_hash: passwordHash,
      role: 'Organizer',
      city: 'Ahmedabad',
      phone_number: '9876543210'
    }
  });

  const [attendee] = await User.findOrCreate({
    where: { email: 'attendee@meetior.in' },
    defaults: {
      name: 'Nevil Sagpariya',
      email: 'attendee@meetior.in',
      password_hash: passwordHash,
      role: 'Attendee',
      city: 'Ahmedabad',
      phone_number: '9123456780'
    }
  });
  console.log('✅ Seeded demo accounts: organizer@meetior.in and attendee@meetior.in (Password: Meetior2026)');

  // 5. Seed Locations & Events
  const sampleEvents = [
    {
      title: 'Sabarmati Riverfront Walk',
      description: 'Start your weekend with a refreshing guided community walk along the scenic Sabarmati Riverfront. Meet fellow fitness & nature enthusiasts, spot migratory birds, and enjoy healthy morning chai!',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 2 * 24 * 3600 * 1000), // In 2 days
      end_datetime: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 2.5 * 3600 * 1000),
      capacity: 50,
      categorySlug: 'Outdoors',
      venue: {
        venue_name: 'Sabarmati Riverfront Promenade',
        formatted_address: 'Near Vallabh Sadan, Sabarmati Riverfront, Ahmedabad, Gujarat, India',
        locality: 'Sabarmati',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380009',
        discovery_city: 'Ahmedabad',
        latitude: 23.0365,
        longitude: 72.5695
      }
    },
    {
      title: 'Kankaria Carnival Fun',
      description: 'Experience an evening packed with carnival rides, lakeside games, puppet shows, mini train rides, and local street delicacies with family and friends around Kankaria Lake.',
      price: 50,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      end_datetime: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 5 * 3600 * 1000),
      capacity: 200,
      categorySlug: 'Carnival',
      venue: {
        venue_name: 'Kankaria Lakefront Gate 1',
        formatted_address: 'Maninagar, Ahmedabad, Gujarat, India',
        locality: 'Maninagar',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380008',
        discovery_city: 'Ahmedabad',
        latitude: 22.9978,
        longitude: 72.6033
      }
    },
    {
      title: 'Gujarati Folk Music Night',
      description: 'Immerse yourself in soulful Gujarati Dayro, Sugam Sangeet, and acoustic folk melodies under the open stars performed by renowned traditional instrumentalists.',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      end_datetime: new Date(Date.now() + 4 * 24 * 3600 * 1000 + 3.5 * 3600 * 1000),
      capacity: 100,
      categorySlug: 'Music',
      venue: {
        venue_name: 'Natarani Amphitheatre',
        formatted_address: 'Usmanpura, Ahmedabad, Gujarat, India',
        locality: 'Usmanpura',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380013',
        discovery_city: 'Ahmedabad',
        latitude: 23.0483,
        longitude: 72.5702
      }
    },
    {
      title: 'Adalaj Stepwell Heritage Tour',
      description: 'Join us for a mesmerizing guided walk through the 5-story deep, beautifully carved Adalaj Stepwell. Learn about its rich history, unique Indo-Islamic architecture, and the legendary story behind its construction. Great for photography and history lovers!',
      price: 150,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 6 * 24 * 3600 * 1000),
      end_datetime: new Date(Date.now() + 6 * 24 * 3600 * 1000 + 3 * 3600 * 1000),
      capacity: 40,
      categorySlug: 'Heritage',
      venue: {
        venue_name: 'Adalaj Stepwell',
        formatted_address: 'Adalaj, Gandhinagar District, Gujarat, India',
        locality: 'Adalaj',
        city: 'Gandhinagar',
        district: 'Gandhinagar',
        state: 'Gujarat',
        postal_code: '382421',
        discovery_city: 'Gandhinagar',
        latitude: 23.1667,
        longitude: 72.5800
      }
    },
    {
      title: 'Art Workshop at Sabarmati',
      description: 'A serene outdoor sketching and watercolor painting workshop under the ancient trees of Sabarmati Ashram. All art supplies, handmade paper, and brushes are included.',
      price: 200,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      end_datetime: new Date(Date.now() + 7 * 24 * 3600 * 1000 + 3 * 3600 * 1000),
      capacity: 30,
      categorySlug: 'Art',
      venue: {
        venue_name: 'Sabarmati Ashram Grounds',
        formatted_address: 'Ashram Road, Ahmedabad, Gujarat, India',
        locality: 'Sabarmati',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380027',
        discovery_city: 'Ahmedabad',
        latitude: 23.0605,
        longitude: 72.5801
      }
    },
    {
      title: 'Skyline Dinner at Patang',
      description: 'Enjoy a panoramic 360-degree view of old and new Ahmedabad from the iconic revolving restaurant while tasting an authentic curated Gujarati & continental tasting menu.',
      price: 1200,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 8 * 24 * 3600 * 1000),
      end_datetime: new Date(Date.now() + 8 * 24 * 3600 * 1000 + 3 * 3600 * 1000),
      capacity: 25,
      categorySlug: 'Food',
      venue: {
        venue_name: 'Patang Re-Evolved Tower',
        formatted_address: 'Nehru Bridge Corner, Ashram Road, Ahmedabad, Gujarat, India',
        locality: 'Ashram Road',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380009',
        discovery_city: 'Ahmedabad',
        latitude: 23.0278,
        longitude: 72.5769
      }
    },
    // Special Event in Koba enforcing Gandhinagar district rule
    {
      title: 'Koba Sunset Heritage Cycling Meet',
      description: 'A delightful evening cycling tour starting from Koba Circle along the scenic greenery of Gandhinagar. Refreshments and cycle maintenance check provided.',
      price: 100,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      end_datetime: new Date(Date.now() + 5 * 24 * 3600 * 1000 + 2.5 * 3600 * 1000),
      capacity: 35,
      categorySlug: 'Outdoors',
      venue: {
        venue_name: 'Koba Circle Garden Grounds',
        formatted_address: 'Koba, Gandhinagar District, Gujarat 382007, India',
        locality: 'Koba',
        city: 'Gandhinagar',
        district: 'Gandhinagar', // Correct administrative classification
        state: 'Gujarat',
        postal_code: '382007',
        discovery_city: 'Gandhinagar', // Appears under Gandhinagar
        latitude: 23.1432,
        longitude: 72.6375
      }
    }
  ];

  for (const evData of sampleEvents) {
    const cat = await Category.findOne({ where: { slug: evData.categorySlug } });
    const [loc] = await Location.findOrCreate({
      where: { venue_name: evData.venue.venue_name },
      defaults: evData.venue
    });

    const [createdEvent] = await Event.findOrCreate({
      where: { title: evData.title },
      defaults: {
        organizer_id: organizer.user_id,
        category_id: cat ? cat.category_id : 1,
        location_id: loc.location_id,
        title: evData.title,
        description: evData.description,
        start_datetime: evData.start_datetime,
        end_datetime: evData.end_datetime,
        capacity: evData.capacity,
        price: evData.price,
        currency: evData.currency,
        status: evData.status
      }
    });

    // Seed default interaction
    await EventInteraction.findOrCreate({
      where: {
        user_id: attendee.user_id,
        event_id: createdEvent.event_id,
        interaction_type: 'Saved'
      },
      defaults: {
        user_id: attendee.user_id,
        event_id: createdEvent.event_id,
        interaction_type: 'Saved'
      }
    });
  }
  console.log(`✅ Seeded ${sampleEvents.length} initial events across Ahmedabad and Gandhinagar.`);

  // 6. Seed a sample Demand
  const techCat = await Category.findOne({ where: { slug: 'Technology' } });
  const [demand] = await EventDemand.findOrCreate({
    where: { title: 'Local AI & Web Dev Workshop for Beginners' },
    defaults: {
      created_by: attendee.user_id,
      title: 'Local AI & Web Dev Workshop for Beginners',
      description: 'Looking for a hands-on weekend workshop on building modern web apps and local AI tools in Ahmedabad.',
      category_id: techCat ? techCat.category_id : null,
      city: 'Ahmedabad',
      preferred_location: 'Navrangpura or SG Highway',
      preferred_date: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      status: 'Open'
    }
  });

  await DemandSupporter.findOrCreate({
    where: { demand_id: demand.demand_id, user_id: attendee.user_id },
    defaults: { demand_id: demand.demand_id, user_id: attendee.user_id }
  });
  console.log('✅ Seeded community demand and supporter.');

  console.log('🎉 Seeding successfully completed!');
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('❌ Seeder Error:', err);
  process.exit(1);
});
