from src.services.ant_colony import AntSystem
from src.services.genetic_algorithm import GeneticAlgorithm
from src.helpers.constants import MATRIX_FIELDS, DB_COLLECTIONS
import firebase_admin
from firebase_admin import firestore
from src.helpers.transform import binaryTroughtMatrix
import base64
import json

firebase_admin.initialize_app()

def getRoutes(event, context):
    print(event)
    geneticSystemArgs = json.loads(base64.b64decode(event['data']).decode('utf-8'))
    print(geneticSystemArgs)
    antSystem = AntSystem()
    geneticSystem = GeneticAlgorithm(antSystem)
    geneticSystem.initialize(**geneticSystemArgs)
    geneticSystem.run()
    result = geneticSystem.decodeChromosome(geneticSystem.population[0])
    print(result)
    db = firestore.client()
    agentsCollection = db.collection(DB_COLLECTIONS.AGENT)
    for agent in result:
        agentsCollection.document(agent["agent_id"]).set( 
            { "route": agent["route"]},
            merge=True
        )