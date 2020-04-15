from src.helpers.constants import DB_COLLECTIONS
import firebase_admin
from firebase_admin import firestore
from firebase_admin import messaging

app = firebase_admin.initialize_app()

def notifyUser(result):
    messages = []
    db = firestore.client()
    agentsCollection = db.collection(DB_COLLECTIONS.AGENT)
    usersCollection = db.collection(DB_COLLECTIONS.USER)
    for agent in result:
        docRef = agentsCollection.document(agent["agent_id"])
        docRef.set( 
            { "route": agent["route"]},
            merge=True
        )
        newAgent = docRef.get().to_dict()
        user = usersCollection.where('email', '==', newAgent['email']).limit(1).stream().__next__().to_dict()
        for token in user['messagingTokens']:
            messages.append(
                messaging.Message( 
                    android=messaging.AndroidConfig(
                        notification=messaging.AndroidNotification(
                            title='Nova Rota',
                            body='Já calculamos sua próxima rota, vem dar uma olhada!! 😉',
                        ),
                    ),
                    token=token
                ) 
            ) 
    messaging.send_all(messages)