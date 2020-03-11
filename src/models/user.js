const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true, 
        unique: true
    },
    isProvider: {
        type: Boolean,
        default: false
    },
    askedPoints: [{
        type: mongoose.Types.ObjectId,
        ref: 'AskedPoint'
    }], 
    agents: [{
        type: mongoose.Types.ObjectId,
        ref: 'Agent'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);