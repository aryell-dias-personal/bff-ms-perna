const { mountGetRoutePayload, publishInTopic, parseDocs } = require('./src/helpers/start-helper');
const { COLLECTION_NAMES } = require('./src/helpers/constants');
const { parseLatLng } = require('./src/helpers/get-maps-data-helper');
const { MESSAGES } = require('./src/helpers/constants');
const { ENCODED_NAMES } = require('./src/helpers/constants');
const { handler } = require('./src/helpers/error-handler');
const randomstring = require("randomstring");
const admin = require("firebase-admin");

admin.initializeApp();

module.exports.startRouteCalculation = (req, res) => handler(req, res, async (body)=>{
    const getRoutePayload = await mountGetRoutePayload(body);
    console.log('GET_ROUTE_PAYLOAD: \n' + JSON.stringify(getRoutePayload));
    await publishInTopic(getRoutePayload);
    return { getRoutePayload: JSON.stringify(getRoutePayload) };
});

module.exports.insertAskedPoint = (req, res) => handler(req, res, async ({ askedPoint, email })=>{
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);

    const newAskedPoint = {
        ...askedPoint, email: email,
        origin: `${askedPoint.origin}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`,
        destiny: `${askedPoint.destiny}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
    };
    await askedPointsRef.add(newAskedPoint);

    return { newAskedPoint: JSON.stringify(newAskedPoint) };
});

module.exports.insertAgent = (req, res) => handler(req, res, async ({ agent, email })=>{
    const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const userQuerySnapshot = await usersRef.where('email', '==', email)
        .where('isProvider', '==', true).limit(1).get();
    const [ user ] = parseDocs(userQuerySnapshot);
    if (!user) throw new Error("Deve ser um provider");

    const agentRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    const newAgent = {
        ...agent, email: email,
        garage: `${agent.garage}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`
    };
    await agentRef.add(newAgent);

    return { newAgent: JSON.stringify(newAgent) };
});

module.exports.insertUser = (req, res) => handler(req, res, async (user)=>{
    const userRef = admin.firestore().collection(COLLECTION_NAMES.USER);
    const userQuerySnapshot = await userRef.where('email', '==', user.email)
        .limit(1).get();
    if(!userQuerySnapshot.empty) throw new Error(MESSAGES.USER_EXISITS);

    await userRef.add(user);
    return { user: JSON.stringify(user) };
});

// daqui pra baixo as coisas podem ser substituidas por subscribe do firebase no flutter
module.exports.getUser = (req, res) => handler(req, res, async ({ email })=>{
    const userRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const userQuerySnapshot = await userRef.where('email', '==', email)
        .limit(1).get();
    const [ user ] = parseDocs(userQuerySnapshot);
    if(!user) throw new Error(MESSAGES.NO_USER);

    return { user: JSON.stringify(user) };
});

module.exports.getMapsData = (req, res) => handler(req, res, async ({ email, currentTime }) => {
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT); 
    const askedPointQuerySnapshot = await askedPointsRef.where('email', '==', email).where('endAt', '>', currentTime)
        .orderBy('endAt').limit(1).get();
    const [ askedPoint ] = parseDocs(askedPointQuerySnapshot);
    
    console.log("ASKED_POINT: " + JSON.stringify(askedPoint));

    const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT); 
    const agentQuerySnapshot = await agentsRef.where('email', '==', email).where('endAt', '>', currentTime)
        .orderBy('endAt').limit(1).get();
    const [ agent ] = parseDocs(agentQuerySnapshot);

    console.log("AGENT: " + JSON.stringify(agent));

    const mapsData = {
        route: agent && agent.route ? agent.route.map(parseLatLng) : [],
        nextPlace: askedPoint && parseLatLng(askedPoint.origin)
    };

    return { out: mapsData };
});

module.exports.getHistory = (req, res) => handler(req, res, async ({ email })=>{
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
    const askedPointsQuerySnapshot = await askedPointsRef.where('email', '==', email).get();
    const askedPoints = parseDocs(askedPointsQuerySnapshot);
    
    console.log("ASKED_POINTS: \n" + askedPoints);
    
    const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    const agentsQuerySnapshot = await agentsRef.where('email', '==', email).get();
    const agents = parseDocs(agentsQuerySnapshot); 

    console.log("AGENTS: \n" + agents);

    const history = agents.concat(askedPoints).sort((first, second)=>{
        return first.createdAt - second.createdAt;
    });

    console.log("HISTORY: \n" + history);

    return { out: history };
});