const mongoose = require('mongoose');

const electionStateSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'campus_election',
    unique: true
  },
  isVotingOpen: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: 'Campus Student Council Election 2026'
  }
}, { timestamps: true });

module.exports = mongoose.models.ElectionState || mongoose.model('ElectionState', electionStateSchema);
