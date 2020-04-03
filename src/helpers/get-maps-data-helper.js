const { ENCODED_NAMES } = require('./constants');

module.exports.parseLatLng = (encodedPlace) => 
    encodedPlace.split(ENCODED_NAMES.SEPARETOR).shift().split(',').map(coord=>Number(coord));