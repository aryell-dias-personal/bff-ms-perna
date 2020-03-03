from src.services.ant_colony import AntSystem
from src.services.genetic_algorithm import GeneticAlgorithm
from src.helpers.constants import MATRIX_FIELDS
from src.helpers.transform import binaryTroughtMatrix
from src.services.aws import deleteMessage
import json
import os

def getRoutes(event, context):
    geneticSystemArgs, receiptHandle = getInfoFromEvent(event)
    antSystem = AntSystem()
    geneticSystem = GeneticAlgorithm(antSystem)
    geneticSystem.initialize(**geneticSystemArgs)
    geneticSystem.run()
    deleteMessage(receiptHandle, os.environ['CALCULATE_ROUTE'])
    result = geneticSystem.decodeChromosome(geneticSystem.population[0])
    print(result)
    return result

def getInfoFromEvent(event):
    print(event)
    records = event['Records']
    return json.loads(records[0]['body']), records[0]['receiptHandle']