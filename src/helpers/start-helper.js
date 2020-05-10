const { getGoogleMatrix } = require('../services/map');
const { ENCODED_NAMES, COLLECTION_NAMES, ASKED_POINT_FIELDS } = require('../helpers/constants');
const { PubSub } = require('@google-cloud/pubsub');
const pubsub = new PubSub();
const admin = require("firebase-admin");

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

const parseDocs = (querySnapshot) => {
    console.log("DOCS: "+ (querySnapshot.empty ? "EMPTY" : JSON.stringify(querySnapshot.docs.map(doc => doc.data()))));
    return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({
        ...doc.data(),
        _id: doc.id
    }));
}

const mountGetRoutePayload = async ({ startTime, endTime }) => {
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
    const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    
    const askedPointsQuery = await askedPointsRef.where(ASKED_POINT_FIELDS.ASKED_START_AT, '>=', startTime)
        .where(ASKED_POINT_FIELDS.ASKED_START_AT, '<=', endTime).get();
    const agentsQuery = await agentsRef.where(ASKED_POINT_FIELDS.ASKED_START_AT, '>=', startTime)
        .where(ASKED_POINT_FIELDS.ASKED_START_AT, '<=', endTime).get();

    const askedPoints = parseDocs(askedPointsQuery); 
    const agents = parseDocs(agentsQuery);

    const localNames = getLocalNames(askedPoints, agents);
    console.log("LOCAL_NAMES: \n" + JSON.stringify(localNames));

    const adjacencyMatrix = await getGoogleMatrix(localNames);

    return {
        agents: agents,
        matrix: {
            askedPoints: askedPoints,
            localNames,
            adjacencyMatrix
        }
    };
}

const publishInTopic = async (getRoutePayload) => {
    const messageBuffer = Buffer.from(JSON.stringify(getRoutePayload), 'utf8');
    const topic = pubsub.topic(process.env.PERNA_TOPIC);
    await topic.publish(messageBuffer);
}

module.exports = {
    publishInTopic,
    parseDocs,
    mountGetRoutePayload
}