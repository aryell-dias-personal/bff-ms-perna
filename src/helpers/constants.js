'use strict';

module.exports = {
  GOOGLE_MAP_API: {
    STATUS_OK: 'OK',
  },
  APP_ENGINE: {
    SERVICE: 'default',
  },
  MESSAGES: {
    NO_USER: 'No user whit this email',
    UNAUTHORIZED_USER: 'unauthorized user',
    USER_DOESNT_EXISITS: 'There is no user whit this email',
    USER_EXISITS: 'There is a user whit this email',
    MUST_BE_PROVIDER: 'Deve ser um provider',
    BUSY_USER: 'O usuário não pode ter um compromisso marcado',
    INVALID_START_END: 'A hora de inicio deve ser menor que a de fim',
    NULL_ASKED_POINT: 'O pedido não pode ser nulo',
    INVALID_QUEUE: 'Não podem existir dias iguais na fila',
    MUST_BE_TWO_PROVIDERS: 'Devem haver dois providers envolvidos',
    NO_DEVICE: 'Nenhum dispositivo cadastrado',
  },
  ENCODED_NAMES: {
    SEPARETOR: '<{*_-_*}>',
  },
  COLLECTION_NAMES: {
    AGENT: 'agent',
    ASKED_POINT: 'askedPoint',
    USER: 'user',
  },
  ASKED_POINT_FIELDS: {
    EMAIL: 'email',
    DATE: 'date',
    QUEUE: 'queue',
    ASKED_START_AT: 'askedStartAt',
    ASKED_END_AT: 'askedEndAt',
  },
  AGENT_FIELDS: {
    EMAIL: 'email',
    DATE: 'date',
    QUEUE: 'queue',
    ASKED_START_AT: 'askedStartAt',
    ASKED_END_AT: 'askedEndAt',
  },
  USER_FIELDS: {
    EMAIL: 'email',
    IS_PROVIDER: 'isProvider',
  },
  RETURN_MESSAGES: {
    SUCCESS: 'success',
  },
};
