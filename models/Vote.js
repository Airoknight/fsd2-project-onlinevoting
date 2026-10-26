const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true, // Guarantees 1 vote per student strictly at DB level
    trim: true,
    uppercase: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Vote || mongoose.model('Vote', voteSchema);
