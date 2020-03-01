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

    def initialize(self, localNames, adjacencyMatrix, askedPoints):
        startTimes, starts = list(zip(*[[point[MATRIX_FIELDS.START_AT], point[MATRIX_FIELDS.ORIGIN]] for point in askedPoints]))
        self.baseTime = min(startTimes)
        self.localNames = localNames
        self.encodedNames = list(np.unique([[
            point[MATRIX_FIELDS.ORIGIN], 
            point[MATRIX_FIELDS.DESTINY] 
        ] for point in askedPoints]).flatten())
        self.start = self.encodedNames.index(starts[np.argmin(startTimes)])
        self.askedPoints = askedPoints
        if len(self.askedPoints) :
            self.origens, self.destinations = list(zip(*[
                (self.encodedNames.index(askedPoint[MATRIX_FIELDS.ORIGIN]),
                    self.encodedNames.index(askedPoint[MATRIX_FIELDS.DESTINY]))
                for askedPoint in self.askedPoints
            ]))
        else:
            self.origens, self.destinations = [], []
        self.bestSolution = None, np.inf
        self.numLabels = len(localNames)
        self.adjacencyMatrix = adjacencyMatrix
        self.bestSolutionRecord = [self.bestSolution[1]]
        self.pheromonesDistrib = np.zeros(2*[len(localNames)]+[2])
        for i in range(self.numLabels):
            for j in range(self.numLabels):
                self.pheromonesDistrib[i, j] = [
                    self.initialPheromone, adjacencyMatrix[i][j][1]
                ]

    def decodeInd(self, encodedPos):
        originalName = self.encodedNames[encodedPos].split('-')[0]
        return self.localNames.index(originalName)

    def getLocalProbabilities(self, currentLocal, possibleChoices, currentTime, currentRoute):
        localFactors = []
        desiredTime = self.getDesiredTime(currentLocal)
        for i in possibleChoices:
            pheromone, distance = self.pheromonesDistrib[self.decodeInd(currentLocal), self.decodeInd(i)]
            actualTime = currentTime+distance
            timeCost = actualTime - desiredTime
            timeDesiredProximity = np.exp(-np.abs(timeCost))
            remainingDest = self.countRemaining(currentRoute+[i])
            remainingDestFactor = np.exp(-(remainingDest/len(self.destinations)))
            attractivity = (1/distance) * timeDesiredProximity * remainingDestFactor if distance != 0 else 0
            localFactors.append(
                (pheromone**self.alpha) * (attractivity**self.beta)
            )
        localFactors = np.array(localFactors) + 0.001
        return localFactors/localFactors.sum()

    def countRemaining(self, route):
        notClosed = set()
        for local in route:
            if local in self.origens:
                indexes = np.array(self.origens) == local
                notClosed = notClosed.union(set(np.array(self.destinations)[indexes]))
            if local in notClosed:
                notClosed.remove(local)
        return len(set(self.origens) - set(route)) + len(notClosed)

    def getRouteCost(self, route, withTimeProximity=False):
        routeCost = 0
        timeCostFactor = 1
        for i in range(len(route)-1):
            currentLocal = route[i]
            nextLocal = route[(i+1) % len(route)]
            desiredTime = self.getDesiredTime(currentLocal)
            _ , distance = self.pheromonesDistrib[self.decodeInd(currentLocal), self.decodeInd(nextLocal)]
            actualTime = routeCost + self.baseTime
            timeCost = actualTime - desiredTime
            timeCostFactor += np.abs(timeCost)/1500 if np.abs(timeCost) > 1500 else 0
            routeCost += distance
        if(withTimeProximity):
            if self.countRemaining(route) != 0:
                return np.inf
            return routeCost*timeCostFactor
        return routeCost

    def getPossibleChoices(self, currentRoute):
        possibleChoices = list(self.origens)
        for local in currentRoute:
            if local in possibleChoices:
                if local in self.origens:
                    possibleChoices = possibleChoices + [self.destinations[i] for i in range(len(self.origens)) if self.decodeInd(self.origens[i]) == self.decodeInd(local)]
        possibleChoices  = list(set(possibleChoices) - set(currentRoute))
        return list(np.unique(possibleChoices))

    def getCurrentTime(self, currentRoute):
        return self.baseTime + self.getRouteCost(currentRoute)

    def getDesiredTime(self, currentLocal):
        desiredOriginTime = [askedPoint[MATRIX_FIELDS.START_AT] for askedPoint in self.askedPoints 
            if currentLocal == self.encodedNames.index(askedPoint[MATRIX_FIELDS.ORIGIN])]
        if(desiredOriginTime.__len__() > 0):
            return desiredOriginTime[0]
        else:
            desiredDestinyTime = [askedPoint[MATRIX_FIELDS.END_AT] for askedPoint in self.askedPoints 
                if currentLocal == self.encodedNames.index(askedPoint[MATRIX_FIELDS.DESTINY])]
            return desiredDestinyTime[0]

    def chooseNextLocal(self, currentRoute):
        currentLocal = currentRoute[-1]
        currentTime = self.getCurrentTime(currentRoute)
        possibleChoices = self.getPossibleChoices(currentRoute)
        prob = self.getLocalProbabilities(currentLocal, possibleChoices, currentTime, currentRoute)
        if(prob.__len__()):
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
                vertex1, vertex2 = self.decodeInd(route[i]), self.decodeInd(route[(i+1) % len(route)])
                index = (vertex1, vertex2)
                deltaPheromone[index] += self.Q/cost

        for i in range(self.numLabels):
            for j in range(self.numLabels):
                pheromone = self.pheromonesDistrib[i, j][0]
                self.pheromonesDistrib[i, j][0] = (
                    1-self.evaporationRate)*pheromone + deltaPheromone[i, j]

    def mountRoutes(self, nOfRoutes = 10):
        routes = [[self.start] for _ in range(nOfRoutes)]
        for route in routes:
            while self.countRemaining(route) >0 and len(route) < 10:
                nextLocal = self.chooseNextLocal(route)
                if(nextLocal is None):
                    break
                route.append(nextLocal)
        routeCosts = [self.getRouteCost(route, withTimeProximity=True) for route in routes]
        return routes, routeCosts

    def run(self, numInt=100):
        for _ in range(numInt):
            routes, routeCosts = self.mountRoutes()
            self.updateBestRoute(routes, routeCosts)
            self.updatePheromone(routes, routeCosts)