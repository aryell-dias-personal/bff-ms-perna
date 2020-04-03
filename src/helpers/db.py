import pymongo
import os

def getCollection(collectionName):
  return pymongo.MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]][collectionName]