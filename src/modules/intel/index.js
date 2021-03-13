'use strict';

const {
  mountGetRoutePayload, enqueue, listQueues, createQueue, updatePernaQueues,
} = require('../../helpers/start-helper');

const { PERNA_QUEUE } = process.env;

const startRouteCalculation = async () => {
  await updatePernaQueues();
  const getRoutePayload = await mountGetRoutePayload();
  console.log(`GET_ROUTE_PAYLOAD: \n${JSON.stringify(getRoutePayload)}`);
  let taskResponse;
  if (getRoutePayload.agents.length
      && getRoutePayload.matrix.askedPoints.length
      && getRoutePayload.matrix.askedPoints.length) {
    const queueNames = await listQueues();
    console.log(`QUEUE_NAMES: \n${JSON.stringify(queueNames)}`);
    if (!queueNames.includes(PERNA_QUEUE)) {
      await createQueue();
    }
    taskResponse = await enqueue(getRoutePayload);
  }
  return {
    getRoutePayload: JSON.stringify(getRoutePayload),
    taskResponse,
  };
};

module.exports = {
  startRouteCalculation,
};
