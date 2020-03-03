const mongoose = require('mongoose');

const {
  Schema
} = mongoose;

const AskedPointSchema = new Schema({
    origin: {
        required: true,
        type: String
    },
    destiny: {
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
    }, 
    used: {
        type: Boolean,
        default: false
    }
}, {
  timestamps: true
});

module.exports = mongoose.models.AskedPoint || mongoose.model('AskedPoint', AskedPointSchema);