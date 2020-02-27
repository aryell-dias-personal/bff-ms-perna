import numpy as np

class Mutation:
    def __init__(self, mutation_rate=0.5):
        self.mutation_rate = mutation_rate

    def generateMutant(self, chromosome):
        return np.random.choice(list(self.gene_set))

    def setup(self, gene_set):
        self.gene_set = gene_set

    def __call__(self, chromosome):

        chromosomeSize = chromosome.__len__()
        numberOfMutations = int(chromosomeSize*self.mutation_rate)

        mutationGenes = []
        places = [a for a in range(chromosome.__len__())]
        for _ in range(numberOfMutations):
            place = np.random.choice(places)
            mutationGenes += [place]

        newChromossome = list(chromosome)
        for place in mutationGenes:
            mutant = self.generateMutant(newChromossome)
        newChromossome[place] = mutant
        return newChromossome