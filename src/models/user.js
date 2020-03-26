const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    photoUrl: {
        type: String
    },
    name: {
        type: String,
        required: true
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

const exportedUserSchema = mongoose.models.User || mongoose.model('User', UserSchema);
UserSchema.path('email').validate(async (email)=>{
    const anotherUser = await exportedUserSchema.findOne({ email }).lean();
    return !anotherUser;
}, "Já existe outro usuario com este email");
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);