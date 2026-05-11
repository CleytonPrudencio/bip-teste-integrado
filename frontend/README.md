# Frontend Angular — Benefícios

SPA Angular 17 (standalone components, signals, reactive forms) que consome a
API REST do backend para gestão de benefícios e transferências.

## Stack

- Angular 17 (standalone, signals, control flow `@if/@for`)
- Reactive Forms
- HttpClient com interceptor de erros
- Karma + Jasmine para testes
- Locale `pt-BR` para formatação de moeda
- CSS custom (sem framework UI externo) com tokens de design

## Como rodar

```bash
npm install
npm start             # http://localhost:4200
```

O `proxy.conf.json` redireciona `/api`, `/v3` e `/swagger-ui` para
`http://localhost:8080`, evitando CORS no dev.

## Build

```bash
npm run build                          # production
npm run build -- --configuration=development
```

## Testes

```bash
npm test
```

13 specs cobrindo serviços, formulários e detecção de origem/destino igual.

## Estrutura

```
src/
├── app/
│   ├── app.config.ts          # bootstrap, locale pt-BR, providers
│   ├── app.routes.ts          # lazy-loaded routes
│   ├── app.component.ts       # shell com header
│   ├── beneficios/            # list + form
│   ├── transferencias/        # form de transferência
│   └── shared/                # service, model, toast, interceptor
├── environments/              # apiUrl
├── styles.css                 # tokens + componentes base
└── index.html
```

## Funcionalidades

- Listagem paginada de benefícios com badge ativo/inativo.
- Criação/edição/remoção com validação reativa.
- Transferência entre benefícios ativos, com bloqueio quando origem = destino.
- Toast de feedback (success, error, warning).
- Interceptor de erros que extrai `message` da resposta do backend e exibe no toast.
