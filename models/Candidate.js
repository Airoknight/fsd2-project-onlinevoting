const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  manifesto: {
    type: String,
    default: 'Committed to student welfare and academic excellence.'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
  },
  voteCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);
