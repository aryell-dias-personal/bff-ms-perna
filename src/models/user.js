const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const UserSchema = new Schema({
    askedPoints: [{
        type: mongoose.Types.ObjectId,
        ref: 'AskedPoint'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);