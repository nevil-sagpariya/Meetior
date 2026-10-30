'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../uploads/events');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const images = [
  {
    name: 'bookfair.jpg',
    url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'heritagewalk.jpg',
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'musicjam.jpg',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'streetfood.jpg',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'techmeetup.jpg',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'potterycraft.jpg',
    url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'morningyoga.jpg',
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'kankariacarnival.jpg',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'delhifoodwalk.jpg',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'delhiacousticjam.jpg',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'lodhiartmural.jpg',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'marinedrivesketch.jpg',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'bandrabandstand.jpg',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
  },
  {
    name: 'cubbonparkreading.jpg',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80'
  }
];

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, item.name);
    const file = fs.createWriteStream(dest);

    const request = (url) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${item.name}: Status ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            const size = fs.statSync(dest).size;
            console.log(`✅ ${item.name} downloaded (${(size / 1024).toFixed(1)} KB)`);
            resolve();
          });
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };

    request(item.url);
  });
}

async function run() {
  console.log('🖼️ Downloading curated authentic event photos for public gatherings...');
  for (const item of images) {
    try {
      await download(item);
    } catch (err) {
      console.error(`❌ Error on ${item.name}:`, err.message);
    }
  }
  console.log('🎉 Done downloading all event photos.');
}

run();
