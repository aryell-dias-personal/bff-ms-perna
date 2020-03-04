const { getGoogleMatrix } = require('./src/services/map');
const AgentSchema = require('./src/models/agent');
const AskedPointSchema = require('./src/models/askedPoint');
const LocalNamesArraySchema = require('./src/models/localNamesArray');
const { generate } = require('./src/config/connection');
const aws = require('./src/services/aws');

let conn = null;

module.exports.startRouteCalculation = async (event, context, callback) => {
    try {
        console.log("EVENT: \n" + JSON.stringify(event, null, 2))
        conn = await generate(conn);
        const { startTime, endTime } = event;

        const agents = await AgentSchema.find({
            startAt: { $gte: startTime, $lte: endTime },
        }).lean();
        const askedPoints = await AskedPointSchema.find({
            startAt: { $gte: startTime, $lte: endTime },
        }).lean();
        const { value: localNames } = await LocalNamesArraySchema.findOneAndUpdate(
            { used: false }, { used: true }, { new: true }
        ).lean();

        const adjacencyMatrix = await getGoogleMatrix(localNames);

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