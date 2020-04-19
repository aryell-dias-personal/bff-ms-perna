const { mountGetRoutePayload, publishInTopic, parseDocs } = require('./src/helpers/start-helper');
const { mountAskedPoint } = require('./src/helpers/insert-asked-helper');
const { mountAgent } = require('./src/helpers/insert-agent-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('./src/helpers/constants');
const { handler } = require('./src/helpers/error-handler');
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
    const newAskedPoint = mountAskedPoint(askedPoint, email);
    await askedPointsRef.add(newAskedPoint);

    return { newAskedPoint: JSON.stringify(newAskedPoint) };
});

module.exports.insertAgent = (req, res) => handler(req, res, async ({ agent, email })=>{
    const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', email)
        .where(USER_FIELDS.IS_PROVIDER, '==', true).limit(1).get();
    const [ user ] = parseDocs(userQuerySnapshot);
    if (!user) throw new Error(MESSAGES.MUST_BE_PROVIDER);

    const agentRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    const newAgent = mountAgent(agent, email);
    await agentRef.add(newAgent);

    return { newAgent: JSON.stringify(newAgent) };
});

module.exports.insertUser = (req, res) => handler(req, res, async (user)=>{
    const userRef = admin.firestore().collection(COLLECTION_NAMES.USER);
    const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', user.email)
        .limit(1).get();
    if(!userQuerySnapshot.empty) throw new Error(MESSAGES.USER_EXISITS);

    await userRef.add(user);
    return { user: JSON.stringify({
        ...user,
        messagingTokens: undefined
    }) };
});

module.exports.getUser = (req, res) => handler(req, res, async ({ email, messagingToken })=>{
    const userRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', email)
        .limit(1).get();
    const [ user ] = parseDocs(userQuerySnapshot);
    if(!user) throw new Error(MESSAGES.NO_USER);
    const newMessagingTokens = [messagingToken , ...user.messagingTokens];
    await userRef.doc(user._id).set({ messagingTokens: newMessagingTokens }, { merge: true });

    return { user: JSON.stringify({
        ...user,
        messagingTokens: undefined
    }) };
});

module.exports.logout = (req, res) => handler(req, res, async ({ email, messagingToken })=>{
    const userRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', email)
        .limit(1).get();
    const [ user ] = parseDocs(userQuerySnapshot);
    if(!user) throw new Error(MESSAGES.NO_USER);
    const newMessagingTokens = user.messagingTokens.filter(token => token !== messagingToken);
    await userRef.doc(user._id).set({ messagingTokens: newMessagingTokens }, { merge: true });

    return { user: JSON.stringify({
        ...user,
        messagingTokens: undefined
    }) };
});