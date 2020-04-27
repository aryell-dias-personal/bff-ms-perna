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

module.exports.insertAskedPoint = (req, res) => handler(req, res, async (askedPoint)=>{
    const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
    const newAskedPoint = mountAskedPoint(askedPoint);
    await askedPointsRef.add(newAskedPoint);

    return { newAskedPoint: JSON.stringify(newAskedPoint) };
});

module.exports.insertAgent = (req, res) => handler(req, res, async (agent)=>{
    const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', agent.email)
        .where(USER_FIELDS.IS_PROVIDER, '==', true).limit(1).get();
    const [ user ] = parseDocs(userQuerySnapshot);
    if (!user) throw new Error(MESSAGES.MUST_BE_PROVIDER);

    const agentRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
    const newAgent = mountAgent(agent);
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

module.exports.askNewAgent = (req, res) => handler(req, res, async ({ fromEmail, agent })=>{
    const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const toUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', agent.email)
        .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
    const fromUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', fromEmail)
        .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
    const users = parseDocs(toUserQuerySnapshot).concat(parseDocs(fromUserQuerySnapshot));
    console.log(`Users: ${JSON.stringify(users)}`);
    if (!users || users.length != 2) throw new Error(MESSAGES.MUST_BE_TWO_PROVIDERS);
    const [ toUser, fromUser ] = users;
    if (toUser.messagingTokens.length == 0) throw new Error(MESSAGES.NO_DEVICE);
    const promisses = toUser.messagingTokens.map(async (token) => {
        await admin.messaging().sendToDevice(token, {
            notification: {
                title: "Pedido de expediente",
                body: `O ${fromUser.name} esta te pedindo um expediente, vem dar um olhada 🔍`,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            },
            data: {
                agent: JSON.stringify(agent),
                fromEmail
            }
        });
    });
    await Promise.all(promisses);
    return { newAgent: agent };
});

module.exports.answerNewAgent = (req, res) => handler(req, res, async ({ fromEmail, toEmail, accepted })=>{
    const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER); 
    const toUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', toEmail)
        .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
    const fromUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', fromEmail)
        .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
    const users = parseDocs(toUserQuerySnapshot).concat(parseDocs(fromUserQuerySnapshot));
    console.log(`Users: ${JSON.stringify(users)}`);
    if (!users || users.length != 2) throw new Error(MESSAGES.MUST_BE_TWO_PROVIDERS);
    const [ toUser, fromUser ] = users;
    if (toUser.messagingTokens.length == 0) throw new Error(MESSAGES.NO_DEVICE);
    const promisses = fromUser.messagingTokens.map(async (token) => {
        await admin.messaging().sendToDevice(token, {
            notification: {
                title: "Pedido de expediente",
                body: `O ${toUser.name} ${accepted?"":"não"} aceitou seu pedindo de expediente ${accepted?"👍":"👎"}`,
                click_action: "FLUTTER_NOTIFICATION_CLICK"
            }
        });
    });
    await Promise.all(promisses);
    return { accepted };
});