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
    TOKEN_REQUIRED: 'Token is required',
    USER_DOESNT_EXISITS: 'There is no user whit this email',
    USER_EXISITS: 'There is a user whit this email',
    MUST_BE_PROVIDER: 'Must be a provider',
    BUSY_USER: 'The user cannot have an appointment scheduled',
    INVALID_START_END: 'Start time must be less than end time',
    NULL_ASKED_POINT: 'Order cannot be null',
    INVALID_QUEUE: 'There cannot be equal days in the queue',
    MUST_BE_TWO_PROVIDERS: 'There must be two providers involved',
    NO_DEVICE: 'No devices registered',
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
