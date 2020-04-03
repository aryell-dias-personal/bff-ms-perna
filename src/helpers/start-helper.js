const { getGoogleMatrix } = require('../services/map');
const AskedPointSchema = require('../models/askedPoint');
const { ENCODED_NAMES } = require('../helpers/constants');
const AgentSchema = require('../models/agent');
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();

const decodeName = (encodedNames) => {
    return encodedNames.map(encodedName => encodedName.split(ENCODED_NAMES.SEPARETOR).shift())
}

const getLocalNames = (askedPoints, agents) => {
    const askedLocalnames = askedPoints.reduce((previous, current) => {
        const { origin, destiny } = current;
        return Array.from(new Set(previous.concat(decodeName([origin, destiny]))))
    }, []);
    const garageLocalnames = agents.reduce((previous, current) => {
        const { garage } = current;
        return Array.from(new Set(previous.concat(decodeName([garage]))))
    }, []);
    return Array.from(new Set(askedLocalnames.concat(garageLocalnames)));
}

module.exports.mountGetRoutePayload = async ({ startTime, endTime }) => {
    const agents = await AgentSchema.find({
        startAt: { $gte: startTime, $lte: endTime },
    }).lean();
    const askedPoints = await AskedPointSchema.find({
        startAt: { $gte: startTime, $lte: endTime },
    }).lean();
    const localNames = getLocalNames(askedPoints, agents);

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