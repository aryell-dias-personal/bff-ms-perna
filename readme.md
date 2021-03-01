# Bem vindo ao bff-ms-perna

Para fazer deploy você precisa:

- Adquirir keyfile.json do ambiente;
    normalmente ao tentar rodar o deploy com serverless, se já não foi configurado ele mostra esse link para ativar
    https://console.developers.google.com/apis/api/deploymentmanager.googleapis.com/overview?project=<CODE>
- Ative o Cloud Deployment Manager V2 API;
    para fazer o deploy é necessário pegar a chave keyfile do projeto especifico
    (IAM e administrador -> contas e servico -> selecionar um email -> adicionar chave -> json)

API e servicos - credenciais, só pesquisar 

> Nota 1: O erro `Cloud Tasks API has not been used in project` pode acontecer, para solucionar ative o cloudtasks em https://console.developers.google.com/apis/api/cloudtasks.googleapis.com/overview?project=<projectid>

> Nota 2: Para deploy de uma só function use o comando abaixo.

```sh
gcloud functions deploy NAME --region=us-east1 --allow-unauthenticated --runtime=nodejs10 --verbosity=info --trigger-http
```