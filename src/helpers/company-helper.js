'use strict';

const admin = require('firebase-admin');
const { COLLECTION_NAMES, MESSAGES } = require('./constants');
const { AuthException } = require('../helpers/error');

const verifyAccess = async (user, companyId) => {
  const companyRef = admin.firestore().collection(COLLECTION_NAMES.COMPANY);
  const company = await companyRef.doc(companyId).get();
  const companyData = company.data();
  console.log(`COMPANY: ${JSON.stringify(companyData)}`);
  if (!company) throw new Error(MESSAGES.NO_COMPANY);
  console.log(`MANAGER_EMAIL: ${companyData.manager}`);
  if (user.email !== companyData.manager) throw new AuthException(MESSAGES.UNAUTHORIZED_USER);
  return {
    companyRef,
    company: companyData,
  };
};

module.exports = {
  verifyAccess,
};
