const { MESSAGES } = require('../helpers/constants');

module.exports.isInsertValid = async ({ date, queue, askedStartAt, askedEndAt }) => {
    if(askedStartAt != null && askedEndAt != null && askedStartAt >= askedEndAt) throw new Error(MESSAGES.INVALID_START_END);
    if(queue != null) {
        const fullQueue = [date, ...queue];
        const uniqueDates = (new Set(fullQueue)).size === fullQueue.length;
        if(!uniqueDates) throw new Error(MESSAGES.INVALID_QUEUE);
    }
    return true;
}