import numpy as np

def binaryTroughtMatrix(adjacencyMatrix, localNames, askedPoints, binaryList):
    askedPoints = [point for binary, point in zip(binaryList, askedPoints) if binary]
    validLocalNames = np.unique([list(point.values()) for point in askedPoints]).flatten()
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