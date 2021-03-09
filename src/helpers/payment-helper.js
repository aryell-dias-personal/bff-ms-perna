'use strict';

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const {
  STRIPE_SECRET_KEY_VERSION_NAME,
} = process.env;

const getStripeScretKey = async () => {
  const [accessResponse] = await client.accessSecretVersion({
    name: STRIPE_SECRET_KEY_VERSION_NAME,
  });
  const responsePayload = accessResponse.payload.data.toString('utf8');
  return responsePayload;
};

module.exports = {
  getStripeScretKey,
};
