const { getGoogleMatrix } = require('./src/services/map');

module.exports.getMatrix = async (event, context, callback) => {
    return getGoogleMatrix(event)
}