import numpy as np

class Crossover:

    def setup(self, gene_set, chromosomeSize):
        self.chromosomeSize = chromosomeSize
        self.gene_set = gene_set

    def __call__(self, chromosome1, chromosome2):
        return self.run([chromosome1, chromosome2])

    def run(self, chromosomes):
        chromosome = []
        complementaryChromosome = []
        for i in range(self.chromosomeSize):
            index = np.random.choice(1)
            complementaryIndex = np.abs(index-1)
            chromosome.append(chromosomes[index][i])
            complementaryChromosome.append(chromosomes[complementaryIndex][i])
        return [chromosome, complementaryChromosome]
