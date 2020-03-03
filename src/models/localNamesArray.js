const mongoose = require('mongoose');

const {
  Schema
} = mongoose;

const LocalNamesArraySchema = new Schema({
    value: [{
        required: true,
        type: String
    }],
    used: {
        type: Boolean,
        default: false
    }
}, {
  timestamps: true
});

module.exports = mongoose.models.LocalNamesArray || mongoose.model('LocalNamesArray', LocalNamesArraySchema);