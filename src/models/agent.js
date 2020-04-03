const mongoose = require('mongoose');

const {
  Schema
} = mongoose;

const AgentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    places: {
        required: true,
        type: Number
    },
    garage: {
        required: true,
        type: String
    },
    route: [{
        type: String
    }],
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