from src.helpers.constants import DB_COLLECTIONS, ENCODED_NAMES, ASKED_POINT_FIELDS, AGENT_FIELDS, USER_FIELDS, MESSAGES
import firebase_admin
from firebase_admin import firestore
from firebase_admin import messaging

app = firebase_admin.initialize_app()

def buildMessage(token, title, body):
    return messaging.Message( 
        android=messaging.AndroidConfig(
            notification=messaging.AndroidNotification(title=title, body=body),
        ),
        token=token
    ) 
def decodePlace(place):
    return place.split(ENCODED_NAMES.SEPARETOR)[0]

def getOriginDestinyTime(route, origin, destiny):
    originTime = None
    destinyTime = None
    for point in route:
        if(point["local"]==decodePlace(origin)):
            originTime = point["time"]
        elif(point["local"]==decodePlace(destiny)):
            destinyTime = point["time"]
        if(originTime and destinyTime):
            break
    return originTime, destinyTime

def handleAskedPoint(agent, askedPointIds, askedPointsCollection, usersCollection):
    messages = []
    for askedPoint in askedPointIds:
        askedPointRef = askedPointsCollection.document(askedPoint)
        askedPoint = askedPointRef.get().to_dict()
        originTime, destinyTime = getOriginDestinyTime(agent["route"], askedPoint["origin"], askedPoint["destiny"])
        askedPointRef.set({
            "originTime": originTime,
            "destinyTime": destinyTime,
            "agentId": agent["agentId"],
            "processed": True
        }, merge=True)
        user = usersCollection.where('email', '==', askedPoint[ASKED_POINT_FIELDS.EMAIL]).limit(1).stream().__next__().to_dict()
        messages += [buildMessage(token,MESSAGES.NEW_ASKED_POINT.TITLE, MESSAGES.NEW_ASKED_POINT.BODY) for token in user[USER_FIELDS.MESSAGING_TOKENS]]
    return messages

def notifyUser(result):
    messages = []
    db = firestore.client()
    askedPointsCollection = db.collection(DB_COLLECTIONS.ASKED_POINT)
    agentsCollection = db.collection(DB_COLLECTIONS.AGENT)
    usersCollection = db.collection(DB_COLLECTIONS.USER)
    for agent in result:
        agentRef = agentsCollection.document(agent["agentId"])
        agentRef.set({ 
            "route": agent["route"],
            "askedPointIds": agent["askedPointIds"],
            "processed": True
        }, merge=True)
        messages += handleAskedPoint(agent, agent["askedPointIds"], askedPointsCollection, usersCollection)
        agent = agentRef.get().to_dict()
        user = usersCollection.where('email', '==', agent[AGENT_FIELDS.EMAIL]).limit(1).stream().__next__().to_dict()
        messages += [buildMessage(token,MESSAGES.NEW_ROUTE.TITLE, MESSAGES.NEW_ROUTE.BODY) for token in user[USER_FIELDS.MESSAGING_TOKENS]]
    messaging.send_all(messages)