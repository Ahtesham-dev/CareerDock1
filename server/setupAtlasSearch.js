require('dotenv').config();
const mongoose = require('mongoose');

const setupSearch = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  try {
    await db.collection('jobs').createIndex({
      title: 'text',
      company: 'text',
      description: 'text',
      skills: 'text',
      location: 'text'
    }, {
      name: 'jobs_text_search',
      weights: { title: 30, skills: 15, company: 10, description: 5, location: 3 }
    });
    console.log('Text search index created');
  } catch (err) {
    console.error('Index creation error:', err.message);
  }
  process.exit(0);
};

setupSearch();
