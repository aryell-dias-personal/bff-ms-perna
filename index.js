const AskedPointSchema = require('./src/models/askedPoint');
const UserSchema = require('./src/models/user');
const AgentSchema = require('./src/models/agent');
const { mountGetRoutePayload, publishInTopic } = require('./src/helpers/start-helper');
const { MESSAGES } = require('./src/helpers/constants');
const { ENCODED_NAMES } = require('./src/helpers/constants');
const { generate } = require('./src/config/connection');
const randomstring = require("randomstring");

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
        console.log("BODY: \n" + req.body);
        conn = await generate(conn);
        const { askedPoint, email } = JSON.parse(req.body);

        const newAskedPoint = new AskedPointSchema({
            ...askedPoint,
            origin: `${askedPoint.origin}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`,
            destiny: `${askedPoint.destiny}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
        });
        await newAskedPoint.save();

        await UserSchema.update({ email }, {
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
        console.log("BODY: \n" + req.body);
        conn = await generate(conn);
        const { agent, email } = JSON.parse(req.body);

        const { isProvider } = await UserSchema.findOne(
            { email }, { isProvider: 1 }
        );
        if (!isProvider) throw new Error("Deve ser um provider")

        const newAgent = new AgentSchema({
            ...agent,
            garage: `${agent.garage}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
        });
        await newAgent.save();

        await UserSchema.update({ email }, {
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

module.exports.insertUser = async (req, res) => {
    try {
        console.log("BODY: \n" + req.body);
        conn = await generate(conn);

        const newUser = new UserSchema(JSON.parse(req.body));
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

module.exports.getUser = async (req, res) => {
    try {
        console.log("BODY: \n" + req.body);
        conn = await generate(conn);

        const { email } = JSON.parse(req.body);

        const user = await UserSchema.findOne(
            { email }, 
            { isProvider: 1 }
        );
        if(!user) throw new Error(MESSAGES.NO_USER);
        res.status(200).send({
            message: "success",
            user: JSON.stringify(user)
        });
    } catch (error) {
        console.log(`ERROR: \n ${error}`);
        res.status(500).send({
            message: "error",
            error: error.message
        });
    }
}