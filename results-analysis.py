import streamlit as st
import pandas as pd
import numpy as np
import pydeck as pdk
import plotly.express as px

from src.services.ant_colony import AntSystem
from src.services.genetic_algorithm import GeneticAlgorithm
from src.helpers.constants import MATRIX_FIELDS, DB_COLLECTIONS, ENCODED_NAMES
from src.helpers.transform import binaryTroughtMatrix
import base64
import json

@st.cache()
def getArgs():
    with open('mocks/getRoutes-args.json') as f:
        event = json.load(f)
        return json.loads(base64.b64decode(event['data']).decode('utf-8'))

bestFitness = []
def geneticFitnessCallback(data):
    global progressBar, bestFitness
    iteration = data.get('iteration')
    numIter = data.get('numIter')
    fitnessValues = data.get('fitnessValues')
    progressBar.progress((iteration+1)/numIter)
    bestFitness.append(max(fitnessValues))


def getRoutes(geneticSystemArgs):
    antSystem = AntSystem()
    geneticSystem = GeneticAlgorithm(antSystem, fitnessCallback=geneticFitnessCallback)
    geneticSystem.initialize(**geneticSystemArgs)
    geneticSystem.run()
    result = geneticSystem.decodeChromosome(geneticSystem.population[0])
    return result

def decodePlace(place):
    strPlace = place.split(ENCODED_NAMES.SEPARETOR)[0]
    return [float(coord) for coord in strPlace.split(',')][::-1]

def parsePoint(point):
    return { **point, 'local': [float(coord) for coord in point['local'].split(',')][::-1] }

def parseRoute(route):
    return [parsePoint(point) for point in route]

geneticSystemArgs = getArgs()
# geneticSystemArgs

progressBar = st.progress(0)
routes = getRoutes(geneticSystemArgs)
# routes

st.write(
    px.line(bestFitness)
)

# allPoints = pd.DataFrame({
#     'awesome cities' : ['Chicago', 'Minneapolis', 'Louisville', 'Topeka'],
#     'lat' : [41.868171, 44.979840,  38.257972, 39.030575],
#     'lon' : [-87.667458, -93.272474, -85.765187,  -95.702548]
# })
ORIGINS_COLOR = [24, 248, 148]
DESTINATIONS_COLOR = [248, 24, 50]
origins = []
destinations = []
for askedPoint in geneticSystemArgs['matrix']['askedPoints']:
    originPoint = decodePlace(askedPoint['origin'])
    destinyPoint = decodePlace(askedPoint['destiny'])
    origins.append(dict(
        lat=originPoint[0],
        lon=originPoint[1],
        color=ORIGINS_COLOR
    ))
    destinations.append(dict(
        lat=destinyPoint[0],
        lon=destinyPoint[1],
        color=DESTINATIONS_COLOR
    ))

origins = pd.DataFrame(origins)
destinations = pd.DataFrame(destinations)
allPoints = pd.concat([origins, destinations], axis=0, ignore_index=True)
allPoints
agg_route_paths = [
    {
        'path': [point['local'] for point in parseRoute(data['route'])]
    }
for data in routes ]

# Adding code so we can have map default to the center of the data
midpoint = (allPoints.lat.mean(), allPoints.lon.mean())
midpoint

# st.deck_gl_chart(
#     viewport={
#         'latitude': midpoint[0],
#         'longitude':  midpoint[1],
#         'zoom': 4
#     },
#     layers=[
#         {
#             'type': 'ScatterplotLayer',
#             'data': data,
#             'radiusScale': 250,
#             'radiusMinPixels': 5,
#             'getFillColor': [248, 24, 148],
#         },
#         {
#             'type': 'LineLayer',
#             'data': path,
#             'getWidth': 1,
#             'getSourcePosition': 'from:{coordinates}',
#             'getTargetPosition': 'to:{coordinates}',
#         },
        
#     ]
# )

# agg_route_paths = [
#     {
#         "path": [
#             [
#                 2.0297719,
#                 41.3911309
#             ],
#             [
#                 -0.4111182,
#                 50
#             ],
#             [
#                 -0.4111182,
#                 39.528239299999996
#             ],
#         ]
#     }
# ]

view_state = pdk.ViewState(
    latitude=midpoint[1],
    longitude=midpoint[0],
    zoom=7
)

print(agg_route_paths)
pointsLayer = pdk.Layer(
    type = 'ScatterplotLayer',
    data = allPoints,
    radiusScale = 250,
    radiusMinPixels = 5,
    get_position=['lat', 'lon'],
    getFillColor = 'color',
)
# destinationsLayer = pdk.Layer(
#     type = 'ScatterplotLayer',
#     data = destinations,
#     radiusScale = 250,
#     radiusMinPixels = 5,
#     get_position=['lat', 'lon'],
#     getFillColor = [248, 24, 50],
# )
pathLayer = pdk.Layer(
    type='PathLayer',
    data=agg_route_paths,
    pickable=True,
    get_color=[248, 24, 148],
    width_scale=20,
    width_min_pixels=2,
    get_path='path',
    get_width=5
)
layers = [pathLayer, pointsLayer]
r = pdk.Deck(layers=layers, initial_view_state=view_state)

st.pydeck_chart(r)