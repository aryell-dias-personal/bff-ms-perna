import numpy as np

class Selection:
    def __init__(self, selection_rate=0.5):
        self.selection_rate = selection_rate

    def __call__(self, population, fitness_values):
        sort_indexes = np.argsort(-np.array(fitness_values))
        num_survivors = int(len(population)*self.selection_rate)
        population = np.array(population)[sort_indexes]
        return population[:num_survivors]