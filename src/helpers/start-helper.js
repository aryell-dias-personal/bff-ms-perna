'use strict';

const { CloudTasksClient } = require('@google-cloud/tasks');
const { Base64 } = require('js-base64');

const admin = require('firebase-admin');
const {
  COLLECTION_NAMES, ASKED_POINT_FIELDS, APP_ENGINE, AGENT_FIELDS,
} = require('../helpers/constants');

const client = new CloudTasksClient();

const {
  REGION,
  PERNA_QUEUE,
  PROJECT,
  INTEL_URL,
} = process.env;

const parseDocs = (querySnapshot) => {
  console.log(`DOCS: ${querySnapshot.empty ? 'EMPTY' : JSON.stringify(querySnapshot.docs.map(doc => doc.data()))}`);
  return querySnapshot.empty ? [] : querySnapshot.docs.map(doc => ({
    ...doc.data(),
    _id: doc.id,
  }));
};

const mountGetRoutePayload = async () => {
  const time = (new Date()).setMinutes(0, 0, 0) / 1000;

  console.log(`TIME: ${JSON.stringify(time)}`);

  const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
  const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);

  const askedPointsQuery = await askedPointsRef.where(ASKED_POINT_FIELDS.DATE, '==', time).get();
  const agentsQuery = await agentsRef.where(AGENT_FIELDS.DATE, '==', time).get();

  let region = [];
  const askedPoints = parseDocs(askedPointsQuery).map((askedPoint) => {
    if (askedPoint.region) region = region.concat(askedPoint.region);
    if (askedPoint.askedStartAt) askedPoint.askedStartAt += askedPoint.date;
    if (askedPoint.askedEndAt) askedPoint.askedEndAt += askedPoint.date;
    delete askedPoint.date;
    delete askedPoint.history;
    delete askedPoint.queue;
    delete askedPoint.agentId;
    delete askedPoint.actualStartAt;
    delete askedPoint.actualEndAt;
    delete askedPoint.staticMap;
    return askedPoint;
  });
  console.log(`ASKED_POINTS: ${JSON.stringify(askedPoints)}`);
  const agents = parseDocs(agentsQuery).map((agent) => {
    if (agent.region) region = region.concat(agent.region);
    if (agent.askedStartAt) agent.askedStartAt += agent.date;
    if (agent.askedEndAt) agent.askedEndAt += agent.date;
    delete agent.date;
    delete agent.position;
    delete agent.history;
    delete agent.queue;
    delete agent.watchedBy;
    delete agent.old;
    delete agent.route;
    delete agent.staticMap;
    return agent;
  });
  console.log(`AGENTS: ${JSON.stringify(agents)}`);

  region = Array.from(new Set(region));
  console.log(`REGION: ${JSON.stringify(region)}`);

  return {
    agents: agents,
    matrix: {
      askedPoints: askedPoints,
      region,
    },
  };
};

const listQueues = async () => {
  const parent = client.locationPath(PROJECT, REGION);
  const [queues] = await client.listQueues({ parent });
  return queues.map((queue) => {
    if (queue && queue.name) {
      return queue.name.split('/').pop();
    }
    return '';
  });
};

const createQueue = () => client.createQueue({
  parent: client.locationPath(PROJECT, REGION),
  queue: {
    name: client.queuePath(PROJECT, REGION, PERNA_QUEUE),
    appEngineHttpQueue: {
      appEngineRoutingOverride: {
        service: APP_ENGINE.SERVICE,
      },
    },
  },
});

const enqueue = async (payload, inSeconds = 10) => {
  const request = {
    parent: client.queuePath(PROJECT, REGION, PERNA_QUEUE),
    task: {
      httpRequest: {
        httpMethod: 'POST',
        url: INTEL_URL,
        body: Base64.encode(JSON.stringify(payload)),
      },
      scheduleTime: {
        seconds: inSeconds + Date.now() / 1000,
      },
    },
  };
  const [response] = await client.createTask(request);
  console.log(`Created task ${response.name}`);
  return response;
};

const applyBatchOnQueue = (eventRef, event, batch) => {
  const eventDoc = event.data();
  console.log(`EVENT_DOC: ${JSON.stringify(eventDoc)}`);
  const nextQueue = eventDoc.queue.slice(1);
  const history = eventDoc.history ? eventDoc.history : [];
  batch.set(eventRef, {
    date: eventDoc.queue[0],
    queue: nextQueue.length ? nextQueue : null,
    history: [eventDoc.date].concat(history),
  }, {
    merge: true,
  });
};

const updatePernaQueues = async () => {
  const today = (new Date()).setMinutes(0, 0, 0) / 1000;
  const yesterday = today - 24 * 60 * 60; // - 1 dia em segundos

  console.log(`YESTERDAY: ${JSON.stringify(yesterday)}`);

  const askedPointsCollection = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
  const agentsCollection = admin.firestore().collection(COLLECTION_NAMES.AGENT);

  const askedPoints = await askedPointsCollection
    .where(ASKED_POINT_FIELDS.DATE, '==', yesterday)
    .where(ASKED_POINT_FIELDS.QUEUE, '!=', null).get();
  const agents = await agentsCollection
    .where(AGENT_FIELDS.DATE, '==', yesterday)
    .where(AGENT_FIELDS.QUEUE, '!=', null).get();

  const batch = admin.firestore().batch();

  if (!askedPoints.empty) {
    askedPoints.docs.forEach((askedPoint) => {
      const askedPointRef = askedPointsCollection.doc(askedPoint.id);
      applyBatchOnQueue(askedPointRef, askedPoint, batch);
    });
  }
  if (!agents.empty) {
    agents.docs.forEach((agent) => {
      const agentRef = agentsCollection.doc(agent.id);
      applyBatchOnQueue(agentRef, agent, batch);
    });
  }

  await batch.commit();
};

module.exports = {
  enqueue,
  listQueues,
  createQueue,
  parseDocs,
  mountGetRoutePayload,
  updatePernaQueues,
};
