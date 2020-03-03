const mongoose = require('mongoose');

const {
  Schema
} = mongoose;

const AgentSchema = new Schema({
    places: {
        required: true,
        type: Number
    },
    garage: {
        required: true,
        type: String
    },
    startAt: {
        required: true,
        type: Number
    },
    endAt: {
        required: true,
        type: Number
    }
}, {
  timestamps: true
});

module.exports = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);