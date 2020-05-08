import numpy as np
from src.helpers.constants import MATRIX_FIELDS, AGENT_FIELDS, ASKED_POINT_FIELDS, ROUTE_POINT_FIELDS
from src.helpers.crossover import Crossover 
from src.helpers.mutation import Mutation 
from src.helpers.selection import Selection
from src.helpers.transform import binaryTroughtMatrix
from functools import lru_cache
import json

class GeneticAlgorithm:
    
    def __init__(self, antSystem):
        self.antSystem = antSystem
        self.selection = Selection()
        self.crossover = Crossover()
        self.mutation = Mutation()
        self.gene_set = [0,1]

    def decodeChromosome(self, chromosome):
        result = []
        for i in range(1, self.numAgents+1):
            binaryList = chromosome[(i-1)*self.numRoutes: i*self.numRoutes]
            antColonyArgs = binaryTroughtMatrix(**self.matrix, agentGarage=self.agents[i-1][AGENT_FIELDS.GARAGE], binaryList=binaryList)
            route = []
            if len(antColonyArgs[MATRIX_FIELDS.LOCAL_NAMES]) :
                self.antSystem.initialize(**antColonyArgs, agent=self.agents[i-1])
                self.antSystem.run()
                encodedRoute, _ = self.antSystem.bestSolution
                timeList = self.antSystem.getTimeList(encodedRoute)
                previous = None
                for localNameIndx, time in zip(encodedRoute, timeList):
                    decodedLocalNameIndx = self.antSystem.decodeInd(localNameIndx)
                    if(previous != decodedLocalNameIndx):
                        route.append({
                            ROUTE_POINT_FIELDS.LOCAL: self.antSystem.localNames[decodedLocalNameIndx],
                            ROUTE_POINT_FIELDS.TIME: time
                        })
                        previous = decodedLocalNameIndx
            fromEmail = self.agents[i-1][AGENT_FIELDS.FROM_EMAIL]
            result.append({
                AGENT_FIELDS.ID: self.agents[i-1][AGENT_FIELDS.ID],
                AGENT_FIELDS.ASKED_POINT_IDS: [askedPoint[ASKED_POINT_FIELDS.ID] for askedPoint in antColonyArgs[MATRIX_FIELDS.ASKED_POINTS]],
                AGENT_FIELDS.WATCHED_BY: [askedPoint[ASKED_POINT_FIELDS.EMAIL] for askedPoint in antColonyArgs[MATRIX_FIELDS.ASKED_POINTS]] + ([fromEmail] if fromEmail else []),
                AGENT_FIELDS.ROUTE: route
            })
        return result

    def isValidChromosome(self, chromosome):
        routesPerAgents = [chromosome[(i-1)*self.numRoutes: i*self.numRoutes] for i in range(1, self.numAgents+1)]
        agentsPerRoutes = list(zip(*routesPerAgents))

        countAgents = [sum(agentsPerRoute) for agentsPerRoute in agentsPerRoutes]
        routesShared = any(np.array(countAgents) > 1)
        
        return (not routesShared) and (sum(chromosome) == self.numRoutes)

    def randomChromossome(self, chromosomeSize):
        numAgents = list(range(self.numAgents))
        chosedIndex = np.random.choice(numAgents, self.numRoutes)
        chromosome = [[int(chosedIndex[i] == j) for j in numAgents] for i in range(self.numRoutes)]
        return np.array(list(zip(*chromosome))).flatten().tolist()

    def initialize(self, matrix, agents, populationSize = 100):
        self.matrix = matrix
        self.agents = agents
        self.numAgents = len(agents)
        self.numRoutes = len(matrix[MATRIX_FIELDS.ASKED_POINTS])
        chromosomeSize = self.numRoutes * self.numAgents
        self.mutation.setup(self.gene_set, self.numRoutes, self.numAgents)
        self.crossover.setup(self.gene_set, self.numRoutes, self.numAgents)
        self.population_size = populationSize
        population = []
        for _ in range(populationSize):            
            population += [self.randomChromossome(chromosomeSize)]
        self.population = population

    def crossoverGenerator(self, pairs):
        for pair in pairs:
            children = self.crossover(*pair)
            for child in children:
                yield child

    @lru_cache(maxsize=None)
    def getAntSystemCost(self, agentAndbinaryList):
        agent, binaryList = json.loads(agentAndbinaryList)
        antColonyArgs = binaryTroughtMatrix(**self.matrix, agentGarage=agent[AGENT_FIELDS.GARAGE] , binaryList=binaryList)
        if len(antColonyArgs[MATRIX_FIELDS.LOCAL_NAMES]) :
            self.antSystem.initialize(**antColonyArgs, agent=agent)
            self.antSystem.run()
            _ , cost = self.antSystem.bestSolution
        else:
            cost = 0
        return cost

    @lru_cache(maxsize=None)
    def fitness_function(self, individual):
        individual = json.loads(individual)
        if not self.isValidChromosome(individual):
            return -1
        costs = []
        for i in range(1, self.numAgents+1):
            binaryList = individual[(i-1)*self.numRoutes: i*self.numRoutes]
            costs.append(self.getAntSystemCost(json.dumps([self.agents[i-1], binaryList])))
        return len(costs)/sum(costs)

    def run(self, numInter=100):
        for i in range(numInter):
            fitness_values = [self.fitness_function(json.dumps(individual)) for individual in self.population]
            survivors = self.selection(self.population, fitness_values)
            if not isinstance(survivors, list):
                survivors = survivors.tolist()
            num_pairs = int(np.ceil((len(self.population) - len(survivors))/2))
            pairs = [(survivors[i], survivors[i+1]) for i in range(num_pairs)]
            new_population = survivors
            gen = self.crossoverGenerator(pairs)
            for _ in range(self.population_size - len(survivors)):
                newElement = self.mutation(next(gen))
                new_population.append(newElement)
            print(*list(zip(self.population, fitness_values))[0])
            self.population = new_population