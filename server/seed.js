require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('./models/Job');

const sampleJobs = [
  { title: 'Senior React Developer', company: 'TechCorp', location: 'Bangalore', type: 'Full-time', experience: 'Senior', source: 'LinkedIn', skills: ['React', 'TypeScript', 'Node.js'], salaryMin: 1800000, salaryMax: 2500000, salaryLabel: '₹18-25L' },
  { title: 'Frontend Engineer', company: 'StartupX', location: 'Remote', type: 'Remote', experience: 'Mid-level', source: 'Wellfound', skills: ['React', 'CSS', 'JavaScript'], salaryMin: 1200000, salaryMax: 1800000, salaryLabel: '₹12-18L' },
  { title: 'Backend Developer', company: 'DataFlow Inc', location: 'Mumbai', type: 'Full-time', experience: 'Mid-level', source: 'Naukri', skills: ['Node.js', 'Express', 'MongoDB'], salaryMin: 1000000, salaryMax: 1500000, salaryLabel: '₹10-15L' },
  { title: 'Data Scientist', company: 'AnalyticsCo', location: 'Pune', type: 'Full-time', experience: 'Senior', source: 'LinkedIn', skills: ['Python', 'TensorFlow', 'SQL'], salaryMin: 2000000, salaryMax: 3000000, salaryLabel: '₹20-30L' },
  { title: 'DevOps Engineer', company: 'CloudBase', location: 'Remote', type: 'Remote', experience: 'Mid-level', source: 'JSearch', skills: ['AWS', 'Docker', 'Kubernetes'], salaryMin: 1500000, salaryMax: 2200000, salaryLabel: '₹15-22L' },
  { title: 'Full Stack Developer', company: 'WebStudio', location: 'Hyderabad', type: 'Hybrid', experience: 'Mid-level', source: 'Internshala', skills: ['React', 'Node.js', 'PostgreSQL'], salaryMin: 800000, salaryMax: 1400000, salaryLabel: '₹8-14L' },
  { title: 'Junior Software Engineer', company: 'CodeBase', location: 'Delhi', type: 'Full-time', experience: 'Fresher', source: 'GitHub', skills: ['JavaScript', 'Python', 'Git'], salaryMin: 400000, salaryMax: 700000, salaryLabel: '₹4-7L' },
  { title: 'Machine Learning Engineer', company: 'AILabs', location: 'Bangalore', type: 'Full-time', experience: 'Senior', source: 'HackerNews', skills: ['Python', 'ML', 'PyTorch'], salaryMin: 2500000, salaryMax: 3500000, salaryLabel: '₹25-35L' },
  { title: 'React Native Developer', company: 'MobileFirst', location: 'Remote', type: 'Remote', experience: 'Mid-level', source: 'Dev.to', skills: ['React Native', 'JavaScript', 'Firebase'], salaryMin: 1000000, salaryMax: 1600000, salaryLabel: '₹10-16L' },
  { title: 'Software Development Engineer', company: 'ProductOrg', location: 'Chennai', type: 'Full-time', experience: 'Mid-level', source: 'Career Pages', skills: ['Java', 'Spring', 'Microservices'], salaryMin: 1200000, salaryMax: 1800000, salaryLabel: '₹12-18L' }
];

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    await Job.deleteMany({});
    await Job.insertMany(sampleJobs);
    console.log('Seeded', sampleJobs.length, 'jobs');
    process.exit(0);
  })
  .catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
