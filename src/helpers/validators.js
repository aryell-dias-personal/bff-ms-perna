const { COLLECTION_NAMES, ASKED_POINT_FIELDS, AGENT_FIELDS } = require('../helpers/constants');
const { parseDocs } = require('./src/helpers/start-helper');
const admin = require("firebase-admin");

module.exports.isInsertValid = async (email, start, end) =>  {
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
    const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    const startAskedPointsQuery = await askedPointsRef
        .where(ASKED_POINT_FIELDS.email, '==', email)
        .where(ASKED_POINT_FIELDS.ASKED_START_AT, '>=', start)
        .where(ASKED_POINT_FIELDS.ASKED_START_AT, '<=', end).get();
    const startAgentsQuery = await agentsRef
        .where(AGENT_FIELDS.email, '==', email)
        .where(AGENT_FIELDS.ASKED_START_AT, '>=', start)
        .where(AGENT_FIELDS.ASKED_START_AT, '<=', end).get();
    const endAskedPointsQuery = await askedPointsRef
        .where(ASKED_POINT_FIELDS.email, '==', email)
        .where(ASKED_POINT_FIELDS.ASKED_END_AT, '>=', start)
        .where(ASKED_POINT_FIELDS.ASKED_END_AT, '<=', end).get();
    const endAgentsQuery = await agentsRef
        .where(AGENT_FIELDS.email, '==', email)
        .where(AGENT_FIELDS.ASKED_END_AT, '>=', start)
        .where(AGENT_FIELDS.ASKED_END_AT, '<=', end).get();
    const startAskedPoints = parseDocs(startAskedPointsQuery);
    const startAgents = parseDocs(startAgentsQuery);
    const endAskedPoints = parseDocs(endAskedPointsQuery);
    const endAgents = parseDocs(endAgentsQuery);
    return (startAskedPoints.length + startAgents.length +endAskedPoints.length + endAgents.length) === 0 
}