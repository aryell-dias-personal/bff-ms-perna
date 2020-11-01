const { makeRequest } = require('../helpers/request-helper');
const { GOOGLE_API_URL, GOOGLE_API_CREDENTIAL } = process.env;

module.exports.distanceMatrix = async (localNames) => {
    const points = localNames.join('|').replace(/ /ig, '+');
    const params = `units=metric&origins=${points}&destinations=${points}&key=${GOOGLE_API_CREDENTIAL}`
    const options = {
        url: `${GOOGLE_API_URL}/distancematrix/json?${params}`
    };
    return await makeRequest(options);
}