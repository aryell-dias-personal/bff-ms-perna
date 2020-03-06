const AskedPointSchema = require('./src/models/askedPoint');
const UserSchema = require('./src/models/user');
const ProviderSchema = require('./src/models/provider');
const AgentSchema = require('./src/models/agent');
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

module.exports.insertAgent = async (req, res) => {
    try {
        console.log("BODY: \n" + JSON.stringify(req.body));
        conn = await generate(conn);
        const { agent, providerId } = req.body;

        const newAgent = new AgentSchema(agent);
        await newAgent.save();

        await UserSchema.update({ _id: providerId }, {
            $push: { agents: newAgent }
        });

        res.status(200).send({
            message: "success",
            newAgent: JSON.stringify(newAgent)
        });
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({
            message: "error",
            error: error.message
        });
    }
}

module.exports.insertProvider = async (req, res) => {
    try {
        console.log("BODY: \n" + JSON.stringify(req.body));
        conn = await generate(conn);

        const newProvider = new ProviderSchema(req.body);
        await newProvider.save();

        res.status(200).send({
            message: "success",
            newProvider: JSON.stringify(newProvider)
        });
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({
            message: "error",
            error: error.message
        });
    }
}

module.exports.insertUser = async (req, res) => {
    try {
        console.log("BODY: \n" + JSON.stringify(req.body));
        conn = await generate(conn);

        const newUser = new UserSchema(req.body);
        await newUser.save();

        res.status(200).send({
            message: "success",
            newUser: JSON.stringify(newUser)
        });
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({
            message: "error",
            error: error.message
        });
    }
}