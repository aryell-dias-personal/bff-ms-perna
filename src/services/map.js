const { distanceMatrix } = require('./google-distance-api')
const { GOOGLE_MAP_API } = require('../helpers/constants')

module.exports.getGoogleMatrix = async ({localNames}) => {
    const { rows = [] } = await distanceMatrix(localNames);
    const adjacencyMatrix = rows.map(({ elements }) => {
        return elements.map(({ distance, duration, status }) => {
            if (status === GOOGLE_MAP_API.STATUS_OK)
                return [distance.value, duration.value];
        });
    });
    return { 
        adjacencyMatrix,
        localNames
    }
}