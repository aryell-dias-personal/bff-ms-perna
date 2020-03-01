import numpy as np

class Mutation:
    def __init__(self, mutation_rate=0.5):
        self.mutation_rate = mutation_rate

    def generateMutant(self):
        numRoutes = list(range(self.numRoutes))
        chosedIndex = np.random.choice(numRoutes)
        return [int(chosedIndex == j) for j in numRoutes]

    def setup(self, gene_set, numRoutes, numAgents):
        self.numRoutes = numRoutes
        self.numAgents = numAgents
        self.gene_set = gene_set

    def encodeChromosome(self, chromosome):
        return list(np.array(list(zip(*chromosome))).flatten())

    def decodeChromosome(self, chromosome):
        return list(zip(*[chromosome[(i-1)*self.numRoutes: i*self.numRoutes] for i in range(1, self.numAgents+1)]))

    def __call__(self, chromosome):
        decodedChromosome = self.decodeChromosome(chromosome)
        chromosomeSize = decodedChromosome.__len__()
        numberOfMutations = int(chromosomeSize*self.mutation_rate)

        mutationGenes = []
        places = list(range(decodedChromosome.__len__()))
        for _ in range(numberOfMutations):
            place = np.random.choice(places)
            mutationGenes += [place]

        newChromossome = list(decodedChromosome)
        for place in mutationGenes:
            mutant = self.generateMutant()
        newChromossome[place] = mutant
        return self.encodeChromosome(newChromossome)