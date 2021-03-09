# Bem Vindo ao BFF-MS-PERNA

## Para Fazer Deploy:

- Adquirir keyfile.json do ambiente e inserir no caminho `./gcloud`;

> Nota: para fazer o deploy é necessário pegar a chave keyfile do projeto especifico (IAM e administrador -> contas e servico -> selecionar um "email" -> adicionar chave -> json)

- inserir informações do firebase em `./src/config/config.json` como abaixo:

```json
{
    "databaseURL": "https://perna-app.firebaseio.com",
    "storageBucket": "perna-app.appspot.com",
    "projectId": "perna-app"
}
```

- Ative o Cloud Deployment Manager V2 API;

> Nota: normalmente ao tentar rodar o deploy com serverless, se já não foi configurado ele mostra esse link para ativar: https://console.developers.google.com/apis/api/deploymentmanager.googleapis.com/overview?project=PROJECT_CODE

- Ative o Cloud Functions API;

- Ative o Cloud Cloud Build API;

- Ative o Directions API;

- Ative o Places API;

- Ative o Maps SDK for Android;

- Ative o Identity Toolkit API;

- Ative o Maps Static API;

- Ative Token Service API;

- Ative Cloud Scheduler API;

- Ative Cloud Tasks API;

- Ative Firebase Installations API;

- Ative Secret Manager API;

- Adicione a chave secreta do Stripe em `Gerenciador de secrets` no console;

> Nota: Ative o cloudtasks em https://console.developers.google.com/apis/api/cloudtasks.googleapis.com/overview?project=PROJECT_ID

- Adicione um App Engine application;

> Nota: https://console.developers.google.com/appengine?project=PROJECT_ID
> Nota: aproveite a faça o deploy do PERNA-INTEL

- Criar chaves de API para o front com os acessos aos serviços: *Directions API*, *Places API*, *Maps SDK for Android*, *Legacy Cloud Source Repositories API*, *Identity Toolkit API* e *Maps Static API*. 

> Nota: (API e servicos -> credenciais)

- Adicionar permissão de edição ao Keyfile.json 

> Nota: Use o "email" selecionado para dar acesso ao deployment (como editor) (API e servicos -> iam -> adicionar) 

- sls deploy -v

- Torne as funções necessárias públicas para o acesso do aplicativo;

- Habilite o acesso das funções a secret por meio da role `Secret Manager Secret Accessor`
> Nota: (IAM e administrador -> PROJECT_ID@appspot.gserviceaccount.com -> habilitar Secret Manager Secret Accessor)
## Firestore

- Não esqueça de atualizar as regras do firestore

- Alguns indices são necessários, dentre eles:

1. askedPoint:
    1. *email*, *processed* e *actualEndAt*
    2. *date* e *queue*

2. agent:
    1. *email*, *date*, *processed* e *askedEndAt* 
    2. *date* e *queue*

3. user:
    2. *email* e *isProvider*

> Nota: todos os indices de forma crescente 
> Nota: A ordem importa 

## Algumas Observações:

> Nota: Para deploy de uma só function use o comando abaixo.

```sh
gcloud functions deploy NAME --region=us-east1 --allow-unauthenticated --runtime=nodejs10 --verbosity=info --trigger-http
```