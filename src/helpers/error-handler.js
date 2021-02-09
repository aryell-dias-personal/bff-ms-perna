const { RETURN_MESSAGES } = require("../helpers/constants");
const { Base64 } = require("js-base64");

const getInfoFromPubSubEvent = event => {
    console.log(`BODY: \n ${event["data"]}`);
    return event["data"] ? JSON.parse(Base64.decode(event["data"])) : null;
};

module.exports.handler = async (req, res, func) => {
    try {
        console.log(`BODY: \n ${req.body}`);
        const body = JSON.parse(req.body);
        const data = await func(body);
        const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
        console.log("FINAL RESULT \n", { response });
        res.status(200).send(response);
    } catch (error) {
        console.log("ERROR: \n", error);
        res.status(500).send({
            message: RETURN_MESSAGES.ERROR,
            error: error.message
        });
    }
}

module.exports.eventHandler =  async (event, context) => {
    try {
        console.log("EVENT: \n", { event, context });
        const body = getInfoFromPubSubEvent(event);
        const data = await func(body);
        const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
        console.log("FINAL RESULT \n", { response });
    } catch (error) {
        console.log("ERROR: \n", error);
    }
};  

module.exports.authHandler = async (req, res, func) => {
    try {
        console.log(`BODY: \n ${req.body}`);
        const body = JSON.parse(req.body);
        const headers = req.headers;
        console.log("HEADERS: \n", req.headers);
        const data = await func(body, headers.authorization);
        const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
        console.log("FINAL RESULT \n", { response });
        res.status(200).send(response);
    } catch (error) {
        console.log("ERROR: \n", error);
        res.status(500).send({
            message: RETURN_MESSAGES.ERROR,
            error: error.message
        });
    }
}