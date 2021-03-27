'use strict';

const admin = require('firebase-admin');
const { COLLECTION_NAMES, MESSAGES } = require('./constants');
const { AuthException } = require('../../helpers/error');

const verifyAccess = async (user, companyId) => {
  const companyRef = admin.firestore().collection(COLLECTION_NAMES.COMPANY);
  const company = await companyRef.doc(companyId).get();
  if (!company) throw new Error(MESSAGES.NO_COMPANY);
  if (user.email !== company.manager) throw new AuthException(MESSAGES.UNAUTHORIZED_USER);
  return {
    companyRef,
    company,
  };
};

module.exports = {
  verifyAccess,
};
