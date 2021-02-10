const { COLLECTION_NAMES, ASKED_POINT_FIELDS, APP_ENGINE } = require('../helpers/constants');
const { CloudTasksClient } = require('@google-cloud/tasks');
const { Base64 } = require("js-base64");

const admin = require("firebase-admin");
const client = new CloudTasksClient();

const {
    REGION,
    PERNA_QUEUE,
    PROJECT,
    INTEL_URL
} = process.env;

const parseDocs = (querySnapshot) => {
    console.log("DOCS: "+ (querySnapshot.empty ? "EMPTY" : JSON.stringify(querySnapshot.docs.map(doc => doc.data()))));
    return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({
        ...doc.data(),
        _id: doc.id
    }));
}

const mountGetRoutePayload = async () => {
    const time = new Date();
    time.setHours(0,0,0,0);

    const startTime = time.setDate(time.getDate() + 1)/1000;
    const endTime = time.setDate(time.getDate() + 1)/1000;

    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
    const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    
    const askedPointsQuery = await askedPointsRef.where(ASKED_POINT_FIELDS.ASKED_START_AT, '>=', startTime)
        .where(ASKED_POINT_FIELDS.ASKED_START_AT, '<=', endTime).get();
    const agentsQuery = await agentsRef.where(ASKED_POINT_FIELDS.ASKED_START_AT, '>=', startTime)
        .where(ASKED_POINT_FIELDS.ASKED_START_AT, '<=', endTime).get();

    const askedPoints = parseDocs(askedPointsQuery); 
    const agents = parseDocs(agentsQuery);

    return {
        agents: agents,
        matrix: {
            askedPoints: askedPoints,
            // TODO: como pegar a região???
            region: [
                "Goiana, PE, BR",
                "Itapissuma, PE, BR",
                "Itamaracá, PE, BR",
                "Igarassu, PE, BR",
                "Abreu e Lima, PE, BR",
                "Paulista, PE, BR",
                "Olinda, PE, BR",
                "Recife, PE, BR"
            ]
        }
    };
}

const listQueues = async () => {
    const parent = client.locationPath(PROJECT, REGION);
    const [queues] = await client.listQueues({parent});
    return queues.map((queue) => {
        if(queue && queue.name) {
            return queue.name.split('/').pop();
        }
        return '';
    });
}

const createQueue = async () => {
    return await client.createQueue({
        parent: client.locationPath(PROJECT, REGION),
        queue: {
          name: client.queuePath(PROJECT, REGION, PERNA_QUEUE),
          appEngineHttpQueue: {
            appEngineRoutingOverride: {
              service: APP_ENGINE.SERVICE
            },
          },
        },
    });
}

const enqueue = async (payload, inSeconds=10) => {
    const request = {
        parent: client.queuePath(PROJECT, REGION, PERNA_QUEUE),
        task: {
            httpRequest: {
                httpMethod: 'POST',
                url: INTEL_URL,
                body: Base64.encode(JSON.stringify(payload))
            },
            scheduleTime: {
                seconds: inSeconds + Date.now() / 1000
            }
        },
    };
    const [response] = await client.createTask(request);
    console.log(`Created task ${response.name}`);
    return response;
}

module.exports = {
    enqueue,
    listQueues,
    createQueue,
    parseDocs,
    mountGetRoutePayload
}