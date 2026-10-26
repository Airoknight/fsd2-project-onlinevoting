const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const ElectionState = require('../models/ElectionState');

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in .env file!');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('✅ Connected successfully to MongoDB!');

    // Clean existing data for clean demo seed
    console.log('🧹 Clearing old collections...');
    await User.deleteMany({});
    await Candidate.deleteMany({});
    await Vote.deleteMany({});
    await ElectionState.deleteMany({});

    // 1. Initialize Election State
    await ElectionState.create({
      key: 'campus_election',
      isVotingOpen: true,
      title: 'College Student Council Elections 2026'
    });
    console.log('✅ Election state initialized (Voting OPEN)');

    // 2. Create Admin Account
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await User.create({
      studentId: 'ADMIN',
      name: 'Chief Election Officer',
      passwordHash: adminPasswordHash,
      role: 'admin',
      hasVoted: false
    });
    console.log('✅ Admin user created: ADMIN / admin123');

    // 3. Create 12 Predefined Demo Student Accounts
    const defaultStudentPassword = await bcrypt.hash('student123', 10);
    const demoStudents = [
      { studentId: '23CS101', name: 'Aarav Sharma' },
      { studentId: '23CS102', name: 'Ananya Iyer' },
      { studentId: '23CS103', name: 'Rohan Gupta' },
      { studentId: '23EC201', name: 'Priya Nair' },
      { studentId: '23EC202', name: 'Vikram Malhotra' },
      { studentId: '23ME301', name: 'Kavya Verma' },
      { studentId: '23ME302', name: 'Arjun Das' },
      { studentId: '23EE401', name: 'Sneha Patel' },
      { studentId: '23EE402', name: 'Aditya Rao' },
      { studentId: '23CE501', name: 'Tanvi Joshi' },
      { studentId: '23IT601', name: 'Devendra Mehra' },
      { studentId: '23IT602', name: 'Ishita Bansal' }
    ];

    for (const student of demoStudents) {
      await User.create({
        studentId: student.studentId,
        name: student.name,
        passwordHash: defaultStudentPassword,
        role: 'student',
        hasVoted: false
      });
    }
    console.log(`✅ Seeded ${demoStudents.length} demo students (Password: student123)`);

    // 4. Create 4 Candidates
    const candidates = [
      {
        name: 'Rahul Mehra',
        department: 'Computer Science (CSE)',
        manifesto: 'Tech innovation for campus, 24/7 coding labs & expanded campus WiFi connectivity.',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        voteCount: 0
      },
      {
        name: 'Sneha Kulkarni',
        department: 'Electronics & Comm (ECE)',
        manifesto: 'Promoting student sports facilities, mental wellness counseling, and club sponsorships.',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        voteCount: 0
      },
      {
        name: 'Arjun Reddy',
        department: 'Mechanical Engineering (ME)',
        manifesto: 'Transparent student union budgeting, hostel hygiene reforms & subsidised cafeteria meals.',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        voteCount: 0
      },
      {
        name: 'Pooja Sundaram',
        department: 'Information Technology (IT)',
        manifesto: 'Empowering internships pipeline, annual cultural fest revamp & alumni mentorship networks.',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        voteCount: 0
      }
    ];

    await Candidate.insertMany(candidates);
    console.log(`✅ Seeded ${candidates.length} election candidates`);

    console.log('\n🎉 Database Seed Complete! Ready for elections demo.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
