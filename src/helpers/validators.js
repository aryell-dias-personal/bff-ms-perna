const { COLLECTION_NAMES, ASKED_POINT_FIELDS, AGENT_FIELDS } = require('../helpers/constants');
const { parseDocs } = require('./start-helper');
const admin = require("firebase-admin");

module.exports.isInsertValid = async (email, start, end) =>  {
    const now = Date.now();
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
    const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    const askedPointsSnapshot = await askedPointsRef
        .where(ASKED_POINT_FIELDS.EMAIL, '==', email)
        .where(ASKED_POINT_FIELDS.ASKED_END_AT, '>=', now/1000).get();
    const agentsSnapshot = await agentsRef
        .where(AGENT_FIELDS.EMAIL, '==', email)
        .where(AGENT_FIELDS.ASKED_END_AT, '>=', now/1000).get();
    const askedPoints = parseDocs(askedPointsSnapshot);
    const agents = parseDocs(agentsSnapshot);
    const event = askedPoints.concat(agents);
    const eventConflicts = event.filter(({ askedStartAt, askedEndAt })=>{
        return (askedStartAt <= start && start <= askedEndAt)
            || (askedStartAt <= end && end <= askedEndAt)
            || (start <= askedStartAt && askedEndAt <= end)
    });
    return !eventConflicts.length;
}