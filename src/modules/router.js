'use strict';

const express = require('serverless-express/express');

const {
  confirmAskedPointPayment,
  deleteCreditCard,
  listCreditCard,
  insertCreditCard,
  turnDefaultCreditCard,
} = require('./payment');
const { answerNewAgent, insertAgent, askNewAgent } = require('./agent');
const { simulateAskedPoint } = require('./askedPoint');
const {
  createCompany,
  deleteCompany,
  updateCompany,
  changeBank,
} = require('./company');
const { getUser, insertUser, logout } = require('./user');
const { handler, authHandler } = require('../helpers/handler');

const router = express.Router();

router.post('/getUser', handler(getUser));
router.post('/insertUser', handler(insertUser));
router.post('/logout', handler(logout));

router.post('/insertAgent', authHandler(insertAgent));
router.post('/answerNewAgent', handler(answerNewAgent));
router.post('/askNewAgent', handler(askNewAgent));

router.post('/simulateAskedPoint', authHandler(simulateAskedPoint));

router.post('/createCompany', authHandler(createCompany));
router.post('/deleteCompany', authHandler(deleteCompany));
router.post('/updateCompany', authHandler(updateCompany));
router.post('/changeBank', authHandler(changeBank));

router.post('/confirmAskedPointPayment', authHandler(confirmAskedPointPayment));
router.post('/deleteCreditCard', authHandler(deleteCreditCard));
router.post('/listCreditCard', authHandler(listCreditCard));
router.post('/insertCreditCard', authHandler(insertCreditCard));
router.post('/turnDefaultCreditCard', authHandler(turnDefaultCreditCard));

module.exports = router;
