const AWS = require('aws-sdk');

const {
  SQS
} = AWS;

AWS.config.update({
  region: process.env.REGION
})

const sqs = new SQS({
  apiVersion: '2012-11-05'
});

const findOrCreateQueue = async QueueName => {

  const queue = await getQueue(QueueName);

  if (queue)
    return queue;

  const params = {
    QueueName,
  };
  return sqs.createQueue(params).promise()

}

const getQueue = async queueName => {

  let queue = null

  try {
    const params = {
      QueueName: queueName,
    };
    queue = await sqs.getQueueUrl(params).promise()
  } catch (error) {
    console.error(error)
  } finally {
    return queue;
  }
}

const sendMessage = async (message, queueName) => {

  const {
    QueueUrl
  } = await findOrCreateQueue(queueName);

  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl
  }
  return sqs.sendMessage(params).promise()
}

const deleteMessage = async (ReceiptHandle, queueName) => {

  const {
    QueueUrl
  } = await findOrCreateQueue(queueName);

  const params = {
    ReceiptHandle,
    QueueUrl
  }
  return sqs.deleteMessage(params).promise()
}

module.exports = {
  sendMessage,
  deleteMessage
};