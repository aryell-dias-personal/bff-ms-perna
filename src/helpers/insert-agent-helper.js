const randomstring = require("randomstring");
const { ENCODED_NAMES } = require('./constants');

module.exports.mountAgent = (agent, email) => ({
    ...agent, email: email,
    garage: `${agent.garage}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
});