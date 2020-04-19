const { RETURN_MESSAGES } = require('../helpers/constants');

module.exports.handler = async (req, res, func) => {
    try {
        console.log("BODY: \n" + req.body);
        const body = JSON.parse(req.body);
        const data = await func(body);
        const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
        res.status(200).send(response);
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({
            message: RETURN_MESSAGES.ERROR,
            error: error.message
        });
    }
}