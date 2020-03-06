const AskedPointSchema = require('./src/models/askedPoint');
const UserSchema = require('./src/models/user');
const { mountGetRoutePayload, publishInTopic } = require('./src/helpers/start-helper');
const { generate } = require('./src/config/connection');

let conn = null;

module.exports.startRouteCalculation = async (req, res) => {
    try {
        console.log("BODY: \n" + JSON.stringify(req.body));
        conn = await generate(conn);
        const getRoutePayload = await mountGetRoutePayload(req.body)
        console.log('GET_ROUTE_PAYLOAD: \n' + JSON.stringify(getRoutePayload));
        publishInTopic(getRoutePayload)
        res.status(200).send({
            message: "success",
            getRoutePayload: JSON.stringify(getRoutePayload)
        });
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({ message: "error", error: error.message });
    }
}

module.exports.insertAskedPoint = async (req, res) => {
    try {
        console.log("BODY: \n" + JSON.stringify(req.body));
        conn = await generate(conn);
        const { askedPoint, userId } = req.body;

        const newAskedPoint = new AskedPointSchema(askedPoint);
        await newAskedPoint.save();

        await UserSchema.update({ _id: userId }, {
            $push: { askedPoints: newAskedPoint }
        });

        res.status(200).send({
            message: "success",
            newAskedPoint: JSON.stringify(newAskedPoint)
        });
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({
            message: "error",
            error: error.message
        });
    }
}