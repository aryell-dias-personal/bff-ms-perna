const { getGoogleMatrix } = require('./src/services/map');
const AgentSchema = require('./src/models/agent');
const AskedPointSchema = require('./src/models/askedPoint');
const LocalNamesArraySchema = require('./src/models/localNamesArray');
const { generate } = require('./src/config/connection');
const { PubSub } = require('@google-cloud/pubsub');

let conn = null;
const pubsub = new PubSub();

module.exports.startRouteCalculation = async (req, res) => {
    try {
        console.log("BODY: \n" + JSON.stringify(req.body));
        conn = await generate(conn);
        const { startTime, endTime } = req.body;

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
        console.log('GET_ROUTE_PAYLOAD: \n' + JSON.stringify(getRoutePayload));

        const topic = pubsub.topic(process.env.PERNA_TOPIC);
        const messageBuffer = Buffer.from(JSON.stringify(getRoutePayload), 'utf8');
        await topic.publish(messageBuffer);

        res.status(200).send("success");
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send("error");
    }
}