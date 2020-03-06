const { getGoogleMatrix } = require('../services/map');
const AskedPointSchema = require('../models/askedPoint');
const AgentSchema = require('../models/agent');
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();

const decodeName = (encodedNames) => {
    return encodedNames.map(encodedName => encodedName.split('-').shift())
}

const getLocalNames = (askedPoints) => {
    return askedPoints.reduce((previous, current) => {
        const { origin, destiny } = current;
        return Array.from(new Set(previous.concat(decodeName([origin, destiny]))))
    }, []);
}

module.exports.mountGetRoutePayload = async ({ startTime, endTime }) => {
    const agents = await AgentSchema.find({
        startAt: { $gte: startTime, $lte: endTime },
    }).lean();
    const askedPoints = await AskedPointSchema.find({
        startAt: { $gte: startTime, $lte: endTime },
    }).lean();
    const localNames = getLocalNames(askedPoints);

    const adjacencyMatrix = await getGoogleMatrix(localNames);

    return {
        agents,
        matrix: {
            askedPoints,
            localNames,
            adjacencyMatrix
        }
    };
}

module.exports.publishInTopic = async (getRoutePayload) => {
    const messageBuffer = Buffer.from(JSON.stringify(getRoutePayload), 'utf8');
    const topic = pubsub.topic(process.env.PERNA_TOPIC);
    await topic.publish(messageBuffer);
}