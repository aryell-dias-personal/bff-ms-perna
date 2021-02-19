const randomstring = require("randomstring");
const { ENCODED_NAMES } = require('./constants');

module.exports.mountAgent = (agent) => {
    let { queue, date } = agent;
    if(queue != null) {
        const fullQueue = [date, ...queue];
        const orderedFullQueue = fullQueue.sort((first, second) => first - second);
        ([date, ...queue] = orderedFullQueue);
    }
    return {
        ...agent,
        queue, date,
        garage: `${agent.garage}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
    };
};
