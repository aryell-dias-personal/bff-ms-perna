import numpy as np

class Crossover:

    def setup(self, gene_set, numRoutes, numAgents):
        self.numRoutes = numRoutes
        self.numAgents = numAgents
        self.gene_set = gene_set

    def __call__(self, chromosome1, chromosome2):
        return self.run([
            self.decodeChromosome(chromosome1), 
            self.decodeChromosome(chromosome2)
        ])

    def encodeChromosome(self, chromosome):
        return list(np.array(list(zip(*chromosome))).flatten())

    def decodeChromosome(self, chromosome):
        return list(zip(*[chromosome[(i-1)*self.numRoutes: i*self.numRoutes] for i in range(1, self.numAgents+1)]))

    def run(self, chromosomes):
        chromosome = []
        complementaryChromosome = []
        for i in range(self.numRoutes):
            index = np.random.choice(1)
            complementaryIndex = np.abs(index-1)
            chromosome.append(chromosomes[index][i])
            complementaryChromosome.append(chromosomes[complementaryIndex][i])
        return [
            self.encodeChromosome(chromosome), 
            self.encodeChromosome(complementaryChromosome)
        ]