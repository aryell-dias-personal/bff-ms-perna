const mongoose = require('mongoose');

const {
  Schema
} = mongoose;

const AskedPointSchema = new Schema({
    origin: {
        required: true,
        type: String,
        unique: true
    },
    destiny: {
        required: true,
        type: String,
        unique: true
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

module.exports = mongoose.models.AskedPoint || mongoose.model('AskedPoint', AskedPointSchema);