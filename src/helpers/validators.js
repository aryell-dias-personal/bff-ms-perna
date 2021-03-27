'use strict';

const admin = require('firebase-admin');
const {
  MESSAGES,
  EVENT_TYPE,
  MODEL_FIELDS,
  COLLECTION_NAMES,
} = require('../helpers/constants');

const isBankValid = async (bank) => {
  if (bank) {
    const bankKeys = Object.keys(bank);
    const joinedKeys = new Set(MODEL_FIELDS.BANK_ACCOUNT.concat(bankKeys));
    if (joinedKeys.size > bankKeys.length) {
      return false;
    }
  } else {
    return false;
  }
  return true;
};

const isCompanyValid = async (company) => {
  if (company) {
    const companyKeys = Object.keys(company);
    const joinedKeys = new Set(MODEL_FIELDS.COMPANY.concat(companyKeys));
    if (joinedKeys.size > companyKeys.length) {
      return false;
    }
  } else {
    return false;
  }
  return true;
};

const isInsertEventValid = async (event, eventType) => {
  if (event && eventType === EVENT_TYPE.AGENT) {
    const eventKeys = Object.keys(event);
    const joinedKeys = new Set(MODEL_FIELDS.AGENT.concat(eventKeys));
    if (joinedKeys.size > eventKeys.length) {
      return false;
    }
    const companyRef = admin.firestore().collection(COLLECTION_NAMES.COMPANY);
    const company = companyRef.doc(event.companyId).get();
    if (!company.employees.includes(event.email)) {
      return false;
    }
  } else if (event && eventType === EVENT_TYPE.AGENT) {
    const eventKeys = Object.keys(event);
    const joinedKeys = new Set(MODEL_FIELDS.AGENT.concat(eventKeys));
    if (joinedKeys.size > eventKeys.length) {
      return false;
    }
  } else {
    throw new Error(MESSAGES.NO_EVENT);
  }

  const {
    date, queue, askedStartAt, askedEndAt,
  } = event;

  if (askedStartAt != null && askedEndAt != null && askedStartAt >= askedEndAt) {
    throw new Error(MESSAGES.INVALID_START_END);
  }
  if (queue != null) {
    const fullQueue = [date, ...queue];
    const uniqueDates = (new Set(fullQueue)).size === fullQueue.length;
    if (!uniqueDates) throw new Error(MESSAGES.INVALID_QUEUE);
  }
  return true;
};

module.exports = {
  isInsertEventValid,
  isBankValid,
  isCompanyValid,
};
