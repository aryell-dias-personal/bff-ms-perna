import streamlit as st
import pandas as pd
import numpy as np
import pydeck as pdk
import plotly.express as px

from src.services.ant_colony import AntSystem
from src.services.genetic_algorithm import GeneticAlgorithm
from src.helpers.constants import MATRIX_FIELDS, DB_COLLECTIONS
from src.helpers.transform import binaryTroughtMatrix
import base64
import json

@st.cache()
def getArgs():
    with open('mocks/getRoutes-args.json') as f:
        event = json.load(f)
        return json.loads(base64.b64decode(event['data']).decode('utf-8'))

def geneticFitnessCallback(data):
    global progressBar
    iteration = data.get('iteration')
    numIter = data.get('numIter')
    fitnessValues = data.get('fitnessValues')
    progressBar.progress((iteration+1)/numIter)


def getRoutes(geneticSystemArgs):
    antSystem = AntSystem()
    geneticSystem = GeneticAlgorithm(antSystem, fitnessCallback=geneticFitnessCallback)
    geneticSystem.initialize(**geneticSystemArgs)
    geneticSystem.run()
    result = geneticSystem.decodeChromosome(geneticSystem.population[0])
    return result

geneticSystemArgs = getArgs()
geneticSystemArgs

# st.write(
#     px.line(
#         [1,2,3]
#     )
# )

progressBar = st.progress(0)
routes = getRoutes(geneticSystemArgs)
routes

data = pd.DataFrame({
    'awesome cities' : ['Chicago', 'Minneapolis', 'Louisville', 'Topeka'],
    'lat' : [41.868171, 44.979840,  38.257972, 39.030575],
    'lon' : [-87.667458, -93.272474, -85.765187,  -95.702548]
})

def buildLine(row) :
    return [
        {
            # inbound: 72633,
            # outbound: 74735,
            'from': {
            'name': '19th St. Oakland (19TH)',
            'coordinates': [-122.269029, 37.80787]
            },
            'to': {
            'name': '12th St. Oakland City Center (12TH)',
            'coordinates': [-122.271604, 37.803664]
            }
        }
    ]

path = []
for i, (_, current) in enumerate(data.iterrows()):
    nextRow = data.iloc[i+1] if i < len(data) - 1 else data.iloc[0]
    path.append(
        {
            # inbound: 72633,
            # outbound: 74735,
            'from': {
                # 'name': '19th St. Oakland (19TH)',
                'coordinates': [current.lat, current.lon]
            },
            'to': {
                # 'name': '12th St. Oakland City Center (12TH)',
                'coordinates': [nextRow.lat, nextRow.lon]
            }
        }
    )

# Adding code so we can have map default to the center of the data
midpoint = (np.average(data['lat']), np.average(data['lon']))

st.deck_gl_chart(
    viewport={
        'latitude': midpoint[0],
        'longitude':  midpoint[1],
        'zoom': 4
    },
    layers=[
        {
            'type': 'ScatterplotLayer',
            'data': data,
            'radiusScale': 250,
            'radiusMinPixels': 5,
            'getFillColor': [248, 24, 148],
        },
        {
            'type': 'LineLayer',
            'data': path,
            'getWidth': 1,
            'getSourcePosition': 'from:{coordinates}',
            'getTargetPosition': 'to:{coordinates}',
        },
        
    ]
)


agg_route_paths = [
    {
        "path": [
            [
                2.0297719,
                41.3911309
            ],
            [
                -0.4111182,
                39.528239299999996
            ],
            [
                -0.4111182,
                39.528239299999996
            ],
        ]
    }
]

view_state = pdk.ViewState(
    latitude=midpoint[0],
    longitude=midpoint[1],
    zoom=4
)

layer = pdk.Layer(
    type='PathLayer',
    data=agg_route_paths,
    pickable=True,
    get_color='color',
    width_scale=20,
    width_min_pixels=2,
    get_path='path',
    get_width=5
)

r = pdk.Deck(layers=[layer], initial_view_state=view_state)

st.pydeck_chart(r)

