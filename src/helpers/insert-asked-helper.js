const randomstring = require("randomstring");
const { ENCODED_NAMES } = require('./src/helpers/constants');

module.exports.mountAskedPoint = (askedPoint, email) => ({
    ...askedPoint, email: email,
    origin: `${askedPoint.origin}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`,
    destiny: `${askedPoint.destiny}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
});
