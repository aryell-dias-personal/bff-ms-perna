'use strict';

const admin = require('firebase-admin');
const modules = require('./src/modules');

admin.initializeApp();

module.exports = modules;
