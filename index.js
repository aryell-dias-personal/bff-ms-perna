const { getGoogleMatrix } = require('./src/services/map');
const { AgentSchema } = require('./src/models/agent');
const { AskedPointSchema } = require('./src/models/askedPoint');
const { LocalNamesArraySchema } = require('./src/models/localNamesArray');
const aws = require('./src/services/aws');

module.exports.startRouteCalculation = async (event, context, callback) => {
    try {

        const { startTime, endTime } = event
    
        const agents = await AgentSchema.find({
            startAt: { $gte: startTime, $lte: endTime },
        });
        const askedPoints = await AskedPointSchema.find({
            startAt: { $gte: startTime, $lte: endTime },
        });
        const localNames = await LocalNamesArraySchema.findOne({
            used: false
        });
        const adjacencyMatrix = getGoogleMatrix(localNames)
    
        const getRoutePayload = {
            agents,
            matrix: {
                askedPoints,
                localNames,
                adjacencyMatrix
            }
        };
        console.log(`GET_ROUTE_PAYLOAD: \n ${getRoutePayload}`, null, 2);
        
        await aws.sendMessage(getRoutePayload, process.env.CALCULATE_ROUTE);
        return getRoutePayload;
    } catch (error) {
        console.log(`ERROR: \n ${error}`, null, 2);
        return error;
    }
}