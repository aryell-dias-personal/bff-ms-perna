from src.services.ant_colony import AntSystem
from src.services.genetic_algorithm import GeneticAlgorithm
from src.helpers.constants import MATRIX_FIELDS
from src.helpers.transform import binaryTroughtMatrix
import boto3

def getRoutes(event, context):
    antSystem = AntSystem()
    geneticSystem = GeneticAlgorithm(antSystem)
    geneticSystem.initialize(**event)
    geneticSystem.run()
    return geneticSystem.decodeChromosome(geneticSystem.population[0])