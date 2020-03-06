from src.services.ant_colony import AntSystem
from src.services.genetic_algorithm import GeneticAlgorithm
from src.helpers.constants import MATRIX_FIELDS
from src.helpers.transform import binaryTroughtMatrix
import base64
import json

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