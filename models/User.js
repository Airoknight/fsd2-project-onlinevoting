const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  hasVoted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
