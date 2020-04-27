const randomstring = require("randomstring");
const { ENCODED_NAMES } = require('./constants');

module.exports.mountAgent = (agent) => ({
    ...agent,
    garage: `${agent.garage}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
});