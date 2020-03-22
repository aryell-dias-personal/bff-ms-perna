import numpy as np
from src.helpers.constants import MATRIX_FIELDS, ENCODED_NAMES

def binaryTroughtMatrix(adjacencyMatrix, localNames, askedPoints, agentGarage, binaryList):
    askedPoints = [point for binary, point in zip(binaryList, askedPoints) if binary]
    validLocalNames = (np.unique([
        list([
            agentGarage.split(ENCODED_NAMES.SEPARETOR)[0]] + [
                point[MATRIX_FIELDS.ORIGIN].split(ENCODED_NAMES.SEPARETOR)[0], 
                point[MATRIX_FIELDS.DESTINY].split(ENCODED_NAMES.SEPARETOR)[0]
        ])
    for point in askedPoints]).flatten()).tolist()
    if(len(validLocalNames)):
        indexes, localNames = zip(*[(i, name) for i, name in enumerate(localNames) if name in validLocalNames])
    else:
        indexes, localNames = [], []
    adjacencyMatrix = [
        [element for j, element in enumerate(line) if j in indexes] 
        for i, line in enumerate(adjacencyMatrix) if i in indexes
    ]
    return {
        "adjacencyMatrix": adjacencyMatrix,
        "localNames": list(localNames),
        "askedPoints": askedPoints
    }