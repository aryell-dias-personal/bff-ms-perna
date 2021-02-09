const { RETURN_MESSAGES } = require('../helpers/constants');

module.exports.handler = async (req, res, func) => {
    try {
        const body = JSON.parse(req.body);
        console.log("BODY: \n", body);
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
        console.log("BODY: \n", body);
        const data = await func(body);
        const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
        console.log("FINAL RESULT \n", { response });
    } catch (error) {
        console.log("ERROR: \n", error);
    }
};  

module.exports.authHandler = async (req, res, func) => {
    try {
        const body = JSON.parse(req.body);
        console.log("BODY: \n", body);
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