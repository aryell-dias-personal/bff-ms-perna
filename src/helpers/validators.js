const { MESSAGES } = require('../helpers/constants');

module.exports.isInsertValid = async (email, start, end) =>  {
    if(start != null && end != null && start >= end) {
        throw new Error(MESSAGES.INVALID_START_END);
    }
    return true;
}