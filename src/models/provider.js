const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const ProviderSchema = new Schema({
    agents: [{
        type: mongoose.Types.ObjectId,
        ref: 'Agent'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.models.Provider || mongoose.model('Provider', ProviderSchema);