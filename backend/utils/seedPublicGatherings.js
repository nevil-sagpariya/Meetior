'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Event, Location, Category, User, EventImage, EventInteraction, sequelize } = require('../models');
const { Op } = require('sequelize');

async function seedPublicGatherings() {
  console.log('🌱 Seeding authentic public gathering events with real matching photos...');

  const organizer = await User.findOne({ where: { email: 'organizer@meetior.in' } });
  if (!organizer) {
    console.error('❌ Organizer account not found. Run seeder first.');
    process.exit(1);
  }

  // 1. Clean up automated test events
  await Event.destroy({
    where: {
      title: {
        [Op.or]: [
          { [Op.like]: 'Surat Sunset Photography Meetup%' },
          { [Op.like]: 'Past Retrospective Meetup%' }
        ]
      }
    }
  });
  console.log('🧹 Cleaned up temporary test-generated events.');

  // Categories helper
  const getCategory = async (name) => {
    let cat = await Category.findOne({ where: { name } });
    if (!cat) {
      cat = await Category.findOne({ where: { slug: name } });
    }
    return cat ? cat.category_id : 1;
  };

  const catOutdoors = await getCategory('Outdoors');
  const catHeritage = await getCategory('Heritage');
  const catMusic = await getCategory('Music');
  const catFood = await getCategory('Food');
  const catTech = await getCategory('Technology');
  const catArt = await getCategory('Art');
  const catCarnival = await getCategory('Carnival');

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  const publicEvents = [
    {
      title: 'Ahmedabad National Book Fair & Lit Meet',
      description: "Ahmedabad's grand public gathering for book lovers, avid readers, authors, and poets. Join open storytelling circles, browse thousands of books from indie publishers, participate in the reader book-swap corner, and attend live author interactions.",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 2 * dayMs),
      end_datetime: new Date(now + 2 * dayMs + 4 * 3600 * 1000),
      capacity: 350,
      category_id: catArt,
      image_path: '/uploads/events/bookfair.jpg',
      venue: {
        venue_name: 'Sabarmati Riverfront Event Centre',
        formatted_address: 'Behind Tagore Hall, Paldi, Ahmedabad, Gujarat 380007, India',
        locality: 'Paldi',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380007',
        discovery_city: 'Ahmedabad',
        latitude: 23.0185,
        longitude: 72.5714
      }
    },
    {
      title: 'Old City Heritage & Pols Photowalk',
      description: "A public morning gathering exploring the historic pols, carved wooden facades, and hidden courtyards of UNESCO World Heritage City Ahmedabad. Bring your camera or phone—photographers, walkers, and history lovers all welcome!",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 3 * dayMs),
      end_datetime: new Date(now + 3 * dayMs + 3 * 3600 * 1000),
      capacity: 60,
      category_id: catHeritage,
      image_path: '/uploads/events/heritagewalk.jpg',
      venue: {
        venue_name: 'Swaminarayan Mandir Gate',
        formatted_address: 'Kalupur, Old City, Ahmedabad, Gujarat 380001, India',
        locality: 'Kalupur',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380001',
        discovery_city: 'Ahmedabad',
        latitude: 23.0315,
        longitude: 72.5960
      }
    },
    {
      title: 'Sabarmati Open Air Indie Music & Acoustic Jam',
      description: "An open community acoustic music meetup under the evening sky. Acoustic guitarists, percussionists, singers, and music lovers gather on the lawn for an unplugged community jam. Everyone is welcome to listen, sing along, or play!",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 4 * dayMs),
      end_datetime: new Date(now + 4 * dayMs + 3.5 * 3600 * 1000),
      capacity: 120,
      category_id: catMusic,
      image_path: '/uploads/events/musicjam.jpg',
      venue: {
        venue_name: 'Natarani Amphitheatre Lawn',
        formatted_address: 'Usmanpura, Riverfront West, Ahmedabad, Gujarat 380013, India',
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
      title: 'Amdavad Street Food & Khau Galli Festival',
      description: "A vibrant public weekend gathering celebrating the authentic flavours of Gujarat and street food from across India. Featuring live food stalls, traditional chaat, artisanal desserts, and open family picnic seating.",
      price: 50,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 5 * dayMs),
      end_datetime: new Date(now + 5 * dayMs + 5 * 3600 * 1000),
      capacity: 500,
      category_id: catFood,
      image_path: '/uploads/events/streetfood.jpg',
      venue: {
        venue_name: 'Riverfront Food Park',
        formatted_address: 'Near Vallabh Sadan, Sabarmati Riverfront, Ahmedabad, Gujarat 380009, India',
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
      title: 'Weekend Developers & Open Source Meetup',
      description: "A monthly gathering of developers, designers, engineering students, and tech enthusiasts. Lightning talks on AI and full-stack engineering, collaborative open-source sprints, and networking over coffee and snacks.",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 6 * dayMs),
      end_datetime: new Date(now + 6 * dayMs + 3 * 3600 * 1000),
      capacity: 80,
      category_id: catTech,
      image_path: '/uploads/events/techmeetup.jpg',
      venue: {
        venue_name: 'Ahmedabad Management Association (AMA) Hall',
        formatted_address: 'ATIRA Campus, Dr. Vikram Sarabhai Marg, Vastrapur, Ahmedabad, Gujarat 380015, India',
        locality: 'Vastrapur',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380015',
        discovery_city: 'Ahmedabad',
        latitude: 23.0275,
        longitude: 72.5342
      }
    },
    {
      title: 'Community Clay Pottery & Terracotta Workshop',
      description: "A hands-on public community craft gathering in the open garden. Learn pottery wheel throwing, terracotta sculpting, and handmade ceramic art from master artisans. All clay, glazes, and tools provided.",
      price: 150,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 7 * dayMs),
      end_datetime: new Date(now + 7 * dayMs + 3 * 3600 * 1000),
      capacity: 40,
      category_id: catArt,
      image_path: '/uploads/events/potterycraft.jpg',
      venue: {
        venue_name: 'Kanoria Centre for Arts Garden',
        formatted_address: 'CEPT Campus, University Road, Navrangpura, Ahmedabad, Gujarat 380009, India',
        locality: 'Navrangpura',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380009',
        discovery_city: 'Ahmedabad',
        latitude: 23.0381,
        longitude: 72.5512
      }
    },
    {
      title: 'Sunday Morning Riverfront Yoga & Wellness Circle',
      description: "Wake up to fresh morning air and join hundreds of fellow citizens for guided morning Surya Namaskar, pranayama breathwork, and mindfulness meditation by the riverfront promenade. Bring your mat!",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 8 * dayMs),
      end_datetime: new Date(now + 8 * dayMs + 2 * 3600 * 1000),
      capacity: 250,
      category_id: catOutdoors,
      image_path: '/uploads/events/morningyoga.jpg',
      venue: {
        venue_name: 'Riverfront Flower Park Lawn',
        formatted_address: 'Ellis Bridge Promenade, Ahmedabad, Gujarat 380006, India',
        locality: 'Ellis Bridge',
        city: 'Ahmedabad',
        district: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380006',
        discovery_city: 'Ahmedabad',
        latitude: 23.0234,
        longitude: 72.5741
      }
    },
    {
      title: 'Kankaria Lakefront Evening Carnival & Puppet Show',
      description: "A lively family-friendly lakeside gathering featuring traditional Gujarati folk puppetry (Kathputli), street performers, carnival games, magic acts, and sunset boat rides around Kankaria Lake.",
      price: 30,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 9 * dayMs),
      end_datetime: new Date(now + 9 * dayMs + 4 * 3600 * 1000),
      capacity: 400,
      category_id: catCarnival,
      image_path: '/uploads/events/kankariacarnival.jpg',
      venue: {
        venue_name: 'Kankaria Lakefront Gate 1',
        formatted_address: 'Maninagar, Ahmedabad, Gujarat 380008, India',
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
      title: 'Koba Sunset Heritage Cycling Meet',
      description: "A delightful evening cycling tour starting from Koba Circle along the scenic greenery of Gandhinagar. Refreshments and cycle maintenance check provided.",
      price: 100,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 5 * dayMs),
      end_datetime: new Date(now + 5 * dayMs + 2.5 * 3600 * 1000),
      capacity: 35,
      category_id: catOutdoors,
      image_path: '/uploads/events/heritagewalk.jpg',
      venue: {
        venue_name: 'Koba Circle Garden Grounds',
        formatted_address: 'Koba, Gandhinagar District, Gujarat 382007, India',
        locality: 'Koba',
        city: 'Gandhinagar',
        district: 'Gandhinagar',
        state: 'Gujarat',
        postal_code: '382007',
        discovery_city: 'Gandhinagar',
        latitude: 23.1432,
        longitude: 72.6375
      }
    },
    {
      title: 'Surat Tapi Riverside Folk Night & Lok Dairo',
      description: "Traditional Gujarati Dayro and folk musical gathering on the Tapi riverfront walkway. Relish the local cultural spirit with renowned folk artists and community listeners.",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 3 * dayMs),
      end_datetime: new Date(now + 3 * dayMs + 3.5 * 3600 * 1000),
      capacity: 200,
      category_id: catMusic,
      image_path: '/uploads/events/musicjam.jpg',
      venue: {
        venue_name: 'Tapi Riverfront Walkway',
        formatted_address: 'Adajan, Surat, Gujarat 395009, India',
        locality: 'Adajan',
        city: 'Surat',
        district: 'Surat',
        state: 'Gujarat',
        postal_code: '395009',
        discovery_city: 'Surat',
        latitude: 21.1959,
        longitude: 72.7933
      }
    },
    {
      title: 'Kochi Muziris Art & Beachside Photowalk',
      description: 'A morning public gathering through historic Fort Kochi, the iconic Chinese Fishing Nets, and colonial art spaces. Photographers, heritage lovers, and morning walkers welcome for an inspiring seaside creative walk!',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 1 * dayMs),
      end_datetime: new Date(now + 1 * dayMs + 3 * 3600 * 1000),
      capacity: 100,
      category_id: catArt,
      image_path: '/uploads/events/heritagewalk.jpg',
      venue: {
        venue_name: 'Fort Kochi Beach Promenade',
        formatted_address: 'Fort Kochi Beach, Kochi, Kerala 682001, India',
        locality: 'Fort Kochi',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        postal_code: '682001',
        discovery_city: 'Kochi',
        latitude: 9.9658,
        longitude: 76.2415
      }
    },
    {
      title: 'Marine Drive Sunset Kathakali & Classical Ragas',
      description: 'An open-air evening community cultural showcase featuring live traditional percussion, classical Carnatic melodies, and authentic Kathakali storytelling along Kochi scenic backwaters.',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 2 * dayMs),
      end_datetime: new Date(now + 2 * dayMs + 4 * 3600 * 1000),
      capacity: 250,
      category_id: catMusic,
      image_path: '/uploads/events/musicjam.jpg',
      venue: {
        venue_name: 'Marine Drive Open Air Amphitheatre',
        formatted_address: 'Marine Drive Walkway, Ernakulam, Kochi, Kerala 682031, India',
        locality: 'Marine Drive',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        postal_code: '682031',
        discovery_city: 'Kochi',
        latitude: 9.9798,
        longitude: 76.2755
      }
    },
    {
      title: 'Kerala Coastal Flavours & Seafood Food Fiesta',
      description: 'A vibrant weekend culinary gathering celebrating coastal Malabar delicacies, freshly spiced seafood, Appam with stew, and traditional payasam desserts with live acoustic seaside music.',
      price: 100,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 4 * dayMs),
      end_datetime: new Date(now + 4 * dayMs + 5 * 3600 * 1000),
      capacity: 400,
      category_id: catFood,
      image_path: '/uploads/events/streetfood.jpg',
      venue: {
        venue_name: 'Old Harbour Heritage Lawn',
        formatted_address: 'Tower Road, Fort Kochi, Kochi, Kerala 682001, India',
        locality: 'Fort Kochi',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        postal_code: '682001',
        discovery_city: 'Kochi',
        latitude: 9.9667,
        longitude: 76.2435
      }
    },
    {
      title: 'Old Delhi Midnight Food Walk & Jama Masjid Heritage Crawl',
      description: 'Curated nighttime exploration of Shahjahanabad culinary gems, Daulat ki Chaat, Natraj Dahi Bhalle, and classic sheermal & kebabs.',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 2 * dayMs),
      end_datetime: new Date(now + 2 * dayMs + 3.5 * 3600 * 1000),
      capacity: 50,
      category_id: catFood,
      image_path: '/uploads/events/delhifoodwalk.jpg',
      venue: {
        venue_name: 'Chandni Chowk Food Street, Old Delhi',
        formatted_address: 'Chandni Chowk, Old Delhi, Delhi 110006, India',
        locality: 'Chandni Chowk',
        city: 'Delhi',
        district: 'Central Delhi',
        state: 'Delhi',
        postal_code: '110006',
        discovery_city: 'Delhi',
        latitude: 28.6506,
        longitude: 77.2303
      }
    },
    {
      title: 'Connaught Place Central Park Indie Acoustic Jam',
      description: 'Unplugged acoustic evening under the radial colonial colonnades with local singer-songwriters, flautists, and poetry enthusiasts.',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 3 * dayMs),
      end_datetime: new Date(now + 3 * dayMs + 3 * 3600 * 1000),
      capacity: 80,
      category_id: catMusic,
      image_path: '/uploads/events/delhiacousticjam.jpg',
      venue: {
        venue_name: 'Connaught Place Central Park, New Delhi',
        formatted_address: 'Central Park, Rajiv Chowk, Connaught Place, New Delhi, Delhi 110001, India',
        locality: 'Connaught Place',
        city: 'Delhi',
        district: 'New Delhi',
        state: 'Delhi',
        postal_code: '110001',
        discovery_city: 'Delhi',
        latitude: 28.6328,
        longitude: 77.2197
      }
    },
    {
      title: 'Lodhi Art District Mural & Graffiti Photowalk',
      description: "Guided photowalk through India's premier open-air public art district with local artists, exploring 50+ expansive wall murals.",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 4 * dayMs),
      end_datetime: new Date(now + 4 * dayMs + 3 * 3600 * 1000),
      capacity: 60,
      category_id: catArt,
      image_path: '/uploads/events/lodhiartmural.jpg',
      venue: {
        venue_name: 'Lodhi Colony Art District, New Delhi',
        formatted_address: 'Lodhi Colony, New Delhi, Delhi 110003, India',
        locality: 'Lodhi Colony',
        city: 'Delhi',
        district: 'South Delhi',
        state: 'Delhi',
        postal_code: '110003',
        discovery_city: 'Delhi',
        latitude: 28.5888,
        longitude: 77.2255
      }
    },
    {
      title: 'Marine Drive Sunset Urban Watercolor & Sketch Meet',
      description: "Relaxing outdoor watercolor and sketchbook gathering capturing Queen's Necklace at golden hour with fellow urban artists.",
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 2 * dayMs),
      end_datetime: new Date(now + 2 * dayMs + 2.5 * 3600 * 1000),
      capacity: 40,
      category_id: catArt,
      image_path: '/uploads/events/marinedrivesketch.jpg',
      venue: {
        venue_name: 'Marine Drive Promenade, Nariman Point',
        formatted_address: 'Marine Drive Promenade, Nariman Point, Mumbai, Maharashtra 400021, India',
        locality: 'Nariman Point',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        postal_code: '400021',
        discovery_city: 'Mumbai',
        latitude: 18.9220,
        longitude: 72.8220
      }
    },
    {
      title: 'Bandra Bandstand Live Indie Music Circle',
      description: 'Evening community acoustic circle with local singer-songwriters overlooking the Arabian Sea breeze at Bandra Bandstand.',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 4 * dayMs),
      end_datetime: new Date(now + 4 * dayMs + 3 * 3600 * 1000),
      capacity: 100,
      category_id: catMusic,
      image_path: '/uploads/events/bandrabandstand.jpg',
      venue: {
        venue_name: 'Bandra Bandstand Amphitheatre, Bandra West',
        formatted_address: 'Bandstand Promenade, Bandra West, Mumbai, Maharashtra 400050, India',
        locality: 'Bandra West',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        postal_code: '400050',
        discovery_city: 'Mumbai',
        latitude: 19.0435,
        longitude: 72.8190
      }
    },
    {
      title: 'Cubbon Park Weekend Bibliophile & Reading Circle',
      description: 'Bring your favorite paperback, sit under the rain trees on the lawn, and discuss literature, philosophy, and poetry with fellow Bengaluru readers.',
      price: 0,
      currency: 'INR',
      status: 'Published',
      start_datetime: new Date(now + 3 * dayMs),
      end_datetime: new Date(now + 3 * dayMs + 3 * 3600 * 1000),
      capacity: 80,
      category_id: catArt,
      image_path: '/uploads/events/cubbonparkreading.jpg',
      venue: {
        venue_name: 'Cubbon Park Bandstand, Central Bengaluru',
        formatted_address: 'Kasturba Road, Sampangi Rama Nagar, Bengaluru, Karnataka 560001, India',
        locality: 'Sampangi Rama Nagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postal_code: '560001',
        discovery_city: 'Bengaluru',
        latitude: 12.9763,
        longitude: 77.5929
      }
    }
  ];

  for (const item of publicEvents) {
    const [loc] = await Location.findOrCreate({
      where: { venue_name: item.venue.venue_name },
      defaults: item.venue
    });
    // Update venue details if already exists
    await loc.update(item.venue);

    const [ev, created] = await Event.findOrCreate({
      where: { title: item.title },
      defaults: {
        organizer_id: organizer.user_id,
        category_id: item.category_id,
        location_id: loc.location_id,
        title: item.title,
        description: item.description,
        start_datetime: item.start_datetime,
        end_datetime: item.end_datetime,
        capacity: item.capacity,
        price: item.price,
        currency: item.currency,
        status: item.status,
        moderation_status: 'Approved'
      }
    });

    if (!created) {
      await ev.update({
        description: item.description,
        price: item.price,
        capacity: item.capacity,
        status: item.status,
        moderation_status: 'Approved',
        location_id: loc.location_id
      });
    }

    // Attach EventImage
    let eventImage = await EventImage.findOne({ where: { event_id: ev.event_id } });
    if (eventImage) {
      eventImage.original_image_path = item.image_path;
      eventImage.generation_status = 'Completed';
      await eventImage.save();
    } else {
      await EventImage.create({
        event_id: ev.event_id,
        original_image_path: item.image_path,
        generation_status: 'Completed'
      });
    }
    console.log(`✅ Event ready: "${item.title}" -> ${item.image_path}`);
  }

  console.log('🎉 Successfully seeded public gathering events with authentic matching photos!');
}

seedPublicGatherings()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  });
