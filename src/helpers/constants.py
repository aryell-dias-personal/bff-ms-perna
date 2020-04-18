class MATRIX_FIELDS:
    LOCAL_NAMES = "localNames"
    ASKED_POINTS = "askedPoints"
    START_AT = "startAt"
    END_AT = "endAt"
    ORIGIN = "origin"
    DESTINY = "destiny"

class USER_FIELDS:
    MESSAGING_TOKENS = "messagingTokens"

class AGENT_FIELDS:
    ID = "_id"
    NUMBER_OF_PLACES = "places"
    GARAGE = "garage"
    START_AT = "startAt"
    EMAIL = "email"
    END_AT = "endAt"

class ASKED_POINT_FIELDS:
    ID = "_id"
    ORIGIN = "origin"
    DESTINY = "destiny"
    START_AT = "startAt"
    EMAIL = "email"
    END_AT = "endAt"

class ENCODED_NAMES:
    SEPARETOR = '<{*_-_*}>'

class ANT_CNFG:
    TIME_THRESHOLD = 1000

class DB_COLLECTIONS:
    AGENT= "agent"
    ASKED_POINT= "askedPoint"
    USER= "user"

class MESSAGES:
   class NEW_ROUTE:
        TITLE = 'Nova Rota'
        BODY = 'Já calculamos sua próxima rota, vem dar uma olhada!! 😉'
   class NEW_ASKED_POINT:
        TITLE = 'Seu Pedido'
        BODY = 'Seu pedido foi processado foi analisado, vem ver se tá tudo certo 😎'