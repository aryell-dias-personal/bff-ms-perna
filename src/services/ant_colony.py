import numpy as np
from src.helpers.constants import MATRIX_FIELDS

class AntSystem:

    def __init__(self, alpha=1, beta=5, evaporationRate=0.5, Q=100, initialPheromone=0.1):
        self.Q = Q
        self.beta = beta
        self.iteration = 0
        self.alpha = alpha
        self.numLabels = None
        self.localNames = None
        self.askedPoints = None
        self.adjacencyMatrix = None
        self.pheromonesDistrib = None
        self.evaporationRate = evaporationRate
        self.initialPheromone = initialPheromone
        self.bestSolution = None, None
        self.bestSolutionRecord = None

    # costType must be 1 -> time or 0 -> distance
    def initialize(self, localNames, adjacencyMatrix, askedPoints, costType=1):
        self.localNames = localNames
        self.askedPoints = askedPoints
        self.bestSolution = None, np.inf
        self.numLabels = len(localNames)
        self.adjacencyMatrix = adjacencyMatrix
        self.bestSolutionRecord = [self.bestSolution[1]]
        self.pheromonesDistrib = np.zeros(2*[len(localNames)]+[2])
        for i in range(self.numLabels):
            for j in range(self.numLabels):
                self.pheromonesDistrib[i, j] = [
                    self.initialPheromone, adjacencyMatrix[i][j][costType]
                ]

    def getLocalProbabilities(self, currentLocal, possibleChoices):
        localFactors = []
        for i in possibleChoices:
            pheromone, distance = self.pheromonesDistrib[currentLocal, i]
            attractivity = 1/(distance + 0.001) if distance != 0 else 0
            localFactors.append(
                (pheromone**self.alpha) * (attractivity**self.beta)
            )
        localFactors = np.array(localFactors) + 0.001
        return localFactors/localFactors.sum()

    def getRouteCost(self, route):
        routeCost = 0
        for i in range(len(route)-1):
            currentLocal = route[i]
            nextLocal = route[(i+1) % len(route)]
            routeCost += self.pheromonesDistrib[currentLocal, nextLocal][1]
        return routeCost

    def getPossibleChoices(self, currentRoute):
        origens, destinations = list(zip(*[
            (self.localNames.index(askedPoint[MATRIX_FIELDS.ORIGIN]),
                self.localNames.index(askedPoint[MATRIX_FIELDS.DESTINY]))
            for askedPoint in self.askedPoints
        ]))
        return [
            i for i in range(self.numLabels)
            if (i not in currentRoute) and ((i not in destinations) or
                                            ((i in destinations) and (origens[destinations.index(i)] in currentRoute)))
        ]

    def chooseNextLocal(self, currentRoute):
        currentLocal = currentRoute[-1]
        possibleChoices = self.getPossibleChoices(currentRoute)
        prob = self.getLocalProbabilities(currentLocal, possibleChoices)
        return np.random.choice(possibleChoices, p=prob)

    def updateBestRoute(self, routes, routeCosts):
        bestRoute = np.argmin(routeCosts)
        if routeCosts[bestRoute] < self.bestSolution[1]:
            self.bestSolution = routes[bestRoute], routeCosts[bestRoute]
        self.bestSolutionRecord.append(self.bestSolution[1])

    def updatePheromone(self, routes, routeCosts):
        deltaPheromone = np.zeros(2*[self.numLabels])
        for route, cost in zip(routes, routeCosts):
            for i in range(len(route)):
                vertex1, vertex2 = route[i], route[(i+1) % len(route)]
                index = (vertex1, vertex2)
                deltaPheromone[index] += self.Q/cost

        for i in range(self.numLabels):
            for j in range(self.numLabels):
                pheromone = self.pheromonesDistrib[i, j][0]
                self.pheromonesDistrib[i, j][0] = (
                    1-self.evaporationRate)*pheromone + deltaPheromone[i, j]

    def mountRoutes(self):
        routes = [[i] for i in self.getPossibleChoices([])]
        for route in routes:
            for _ in range(self.numLabels-1):
                route.append(self.chooseNextLocal(route))
        routeCosts = [self.getRouteCost(route) for route in routes]
        return routes, routeCosts

    def run(self, numInt=100):
        for _ in range(numInt):
            routes, routeCosts = self.mountRoutes()
            self.updateBestRoute(routes, routeCosts)
            self.updatePheromone(routes, routeCosts)
