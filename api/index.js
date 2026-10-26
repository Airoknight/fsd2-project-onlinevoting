const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const connectToDatabase = require('./db');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
const ElectionState = require('../models/ElectionState');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'campusvote_super_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Middleware to ensure DB is connected before handling API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectToDatabase();
      next();
    } catch (err) {
      console.error('Database connection error:', err.message);
      return res.status(500).json({ 
        error: 'Database connection failed. Please ensure MONGODB_URI is properly set in .env' 
      });
    }
  } else {
    next();
  }
});

// Helper for JWT authentication
const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    let token = req.cookies.token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please login.' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired session. Please login again.' });
    }
  };
};

// ---------------- API ROUTES ---------------- //

// 1. Get current election state & status
app.get('/api/election/status', async (req, res) => {
  try {
    let state = await ElectionState.findOne({ key: 'campus_election' });
    if (!state) {
      state = await ElectionState.create({ key: 'campus_election', isVotingOpen: true });
    }
    const totalVotes = await Vote.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    res.json({
      title: state.title,
      isVotingOpen: state.isVotingOpen,
      totalVotes,
      totalStudents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Auth: Register / Sign Up (New Student)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { studentId, name, password } = req.body;
    if (!studentId || !password || !name) {
      return res.status(400).json({ error: 'Please provide Student ID, Full Name, and Password.' });
    }

    const cleanId = studentId.trim().toUpperCase();
    const existingUser = await User.findOne({ studentId: cleanId });
    if (existingUser) {
      return res.status(400).json({ error: 'Student ID already registered. Please log in.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      studentId: cleanId,
      name: name.trim(),
      passwordHash,
      role: cleanId === 'ADMIN' ? 'admin' : 'student',
      hasVoted: false
    });

    const token = jwt.sign(
      { id: newUser._id, studentId: newUser.studentId, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 3600 * 1000
    });

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: {
        id: newUser._id,
        studentId: newUser.studentId,
        name: newUser.name,
        role: newUser.role,
        hasVoted: newUser.hasVoted
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Auth: Login (Student & Admin)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) {
      return res.status(400).json({ error: 'Please provide ID and password' });
    }

    const user = await User.findOne({ studentId: studentId.trim().toUpperCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user._id, studentId: user.studentId, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 12 * 3600 * 1000
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        studentId: user.studentId,
        name: user.name,
        role: user.role,
        hasVoted: user.hasVoted
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Auth: Get current profile
app.get('/api/auth/me', authMiddleware(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Auth: Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// 5. Candidates: Get list of candidates
app.get('/api/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: 1 });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Voting: Cast a vote (Student only)
app.post('/api/vote', authMiddleware(['student']), async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ error: 'Candidate ID is required' });
    }

    // Check if voting is open
    let state = await ElectionState.findOne({ key: 'campus_election' });
    if (state && !state.isVotingOpen) {
      return res.status(403).json({ error: 'Voting is currently closed by the administrator.' });
    }

    // Check if student already marked as voted
    const student = await User.findById(req.user.id);
    if (!student || student.hasVoted) {
      return res.status(400).json({ error: 'You have already cast your vote!' });
    }

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Selected candidate does not exist' });
    }

    // Record vote with unique index constraint protection
    try {
      await Vote.create({
        studentId: student.studentId,
        candidateId: candidate._id
      });
    } catch (voteErr) {
      if (voteErr.code === 11000) {
        return res.status(400).json({ error: 'A vote for this student has already been registered.' });
      }
      throw voteErr;
    }

    // Increment vote count and mark student as voted
    candidate.voteCount = (candidate.voteCount || 0) + 1;
    await candidate.save();

    student.hasVoted = true;
    await student.save();

    res.json({
      message: 'Your vote has been submitted successfully!',
      candidate: candidate.name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Results: Get election results (Available when voting is closed OR admin requests it)
app.get('/api/results', async (req, res) => {
  try {
    let state = await ElectionState.findOne({ key: 'campus_election' });
    const isVotingOpen = state ? state.isVotingOpen : true;

    // Optional admin check override
    let isAdmin = false;
    let token = req.cookies.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role === 'admin') isAdmin = true;
      } catch (e) {}
    }

    // As per user spec: results shown after admin closes voting (or to admin live)
    if (isVotingOpen && !isAdmin) {
      return res.status(403).json({
        isVotingOpen: true,
        message: 'Voting is still in progress! Results will be published once voting has closed.'
      });
    }

    const candidates = await Candidate.find().sort({ voteCount: -1 });
    const totalVotes = candidates.reduce((acc, c) => acc + (c.voteCount || 0), 0);

    res.json({
      isVotingOpen,
      totalVotes,
      candidates: candidates.map(c => ({
        id: c._id,
        name: c.name,
        department: c.department,
        image: c.image,
        voteCount: c.voteCount || 0,
        percentage: totalVotes > 0 ? (((c.voteCount || 0) / totalVotes) * 100).toFixed(1) : 0
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ADMIN ROUTES ---------------- //

// Toggle voting open / close
app.post('/api/admin/toggle-voting', authMiddleware(['admin']), async (req, res) => {
  try {
    let state = await ElectionState.findOne({ key: 'campus_election' });
    if (!state) {
      state = new ElectionState({ key: 'campus_election' });
    }
    state.isVotingOpen = !state.isVotingOpen;
    await state.save();

    res.json({
      message: `Voting is now ${state.isVotingOpen ? 'OPEN' : 'CLOSED'}`,
      isVotingOpen: state.isVotingOpen
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Candidate
app.post('/api/admin/candidates', authMiddleware(['admin']), async (req, res) => {
  try {
    const { name, department, manifesto, image } = req.body;
    if (!name || !department) {
      return res.status(400).json({ error: 'Name and Department are required' });
    }

    const candidate = await Candidate.create({
      name,
      department,
      manifesto: manifesto || 'Committed to student welfare and academic excellence.',
      image: image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    });

    res.status(201).json({ message: 'Candidate added successfully', candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Candidate
app.delete('/api/admin/candidates/:id', authMiddleware(['admin']), async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin stats
app.get('/api/admin/stats', authMiddleware(['admin']), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const studentsVoted = await User.countDocuments({ role: 'student', hasVoted: true });
    const candidates = await Candidate.find().sort({ voteCount: -1 });
    const state = await ElectionState.findOne({ key: 'campus_election' });

    res.json({
      totalStudents,
      studentsVoted,
      turnoutRate: totalStudents > 0 ? ((studentsVoted / totalStudents) * 100).toFixed(1) : 0,
      isVotingOpen: state ? state.isVotingOpen : true,
      candidates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to static html if requested
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Start local server if not running serverless on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 CampusVote Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
