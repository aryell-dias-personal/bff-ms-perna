const randomstring = require("randomstring");
const { ENCODED_NAMES } = require('./constants');

module.exports.mountAskedPoint = (askedPoint) => ({
    ...askedPoint,
    origin: `${askedPoint.origin}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`,
    destiny: `${askedPoint.destiny}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
});
