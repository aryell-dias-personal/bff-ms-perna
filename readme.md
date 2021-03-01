# Bem Vindo ao BFF-MS-PERNA

## Para Fazer Deploy:

- Adquirir keyfile.json do ambiente;

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

> Nota: Ative o cloudtasks em https://console.developers.google.com/apis/api/cloudtasks.googleapis.com/overview?project=PROJECT_ID

- add an App Engine application;

> Nota: https://console.developers.google.com/appengine?project=PROJECT_ID
> Nota: aproveite a faça o deploy do PERNA-INTEL

- Criar chaves de API para o front com os acessos aos serviços: *Directions API*, *Places API*, *Maps SDK for Android*, *Legacy Cloud Source Repositories API*, *Identity Toolkit API* e *Maps Static API*. 

> Nota: (API e servicos -> credenciais)

- Adicionar permissão de edição ao Keyfile.json 

> Nota: Use o "email" selecionado para dar acesso ao deployment (como editor) (API e servicos -> iam -> adicionar) 

- sls deploy -v

- Torne as funções necessárias públicas para o acesso do aplicativo;

## Algumas Observações:

> Nota: Para deploy de uma só function use o comando abaixo.

```sh
gcloud functions deploy NAME --region=us-east1 --allow-unauthenticated --runtime=nodejs10 --verbosity=info --trigger-http
```