# 📋 Instruções de Deploy no Vercel

## Pré-requisitos

1. Conta no Vercel (gratuita): https://vercel.com
2. Node.js instalado (versão 18 ou superior)
3. Git instalado

## Método 1: Deploy via GitHub (Recomendado)

### Passo 1: Criar Repositório no GitHub

1. Acesse https://github.com
2. Crie um novo repositório
3. Faça upload dos arquivos do projeto `appointment-nodejs`

### Passo 2: Conectar ao Vercel

1. Acesse https://vercel.com
2. Faça login com sua conta
3. Clique em "Add New Project"
4. Importe o repositório GitHub criado
5. O Vercel detectará automaticamente:
   - Framework: Node.js
   - Build Command: (deixe vazio ou `npm install`)
   - Output Directory: (deixe vazio)
   - Install Command: `npm install`

### Passo 3: Configurar Variáveis de Ambiente

No painel do Vercel, adicione as variáveis de ambiente:
- `NODE_ENV=production`
- `PORT=3000` (opcional, o Vercel define automaticamente)

### Passo 4: Deploy

1. Clique em "Deploy"
2. Aguarde o processo de build
3. Seu site estará disponível em uma URL do tipo: `https://seu-projeto.vercel.app`

## Método 2: Deploy via CLI do Vercel

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Login

```bash
vercel login
```

### Passo 3: Deploy

No diretório do projeto:

```bash
cd appointment-nodejs
vercel
```

Siga as instruções:
- Set up and deploy? **Y**
- Which scope? (selecione sua conta)
- Link to existing project? **N**
- Project name? (digite um nome ou pressione Enter)
- Directory? (pressione Enter para usar o diretório atual)
- Override settings? **N**

### Passo 4: Deploy de Produção

```bash
vercel --prod
```

## 📝 Configurações Importantes

### Arquivo vercel.json

O arquivo `vercel.json` já está configurado para:
- Servir arquivos estáticos da pasta `public`
- Roteamento correto para o Express
- Build automático

### Estrutura de Arquivos

Certifique-se de que a estrutura está assim:
```
appointment-nodejs/
├── server.js
├── package.json
├── vercel.json
├── public/
├── views/
├── routes/
└── controllers/
```

## 🔧 Troubleshooting

### Erro: "Cannot find module"

**Solução:** Certifique-se de que todas as dependências estão no `package.json` e execute `npm install` antes do deploy.

### Erro: "Port already in use"

**Solução:** O Vercel define a porta automaticamente. Não use `app.listen()` em produção. O `server.js` já está configurado corretamente.

### Assets não carregam

**Solução:** Verifique se os arquivos estão na pasta `public/` e se as rotas em `server.js` estão configuradas corretamente.

### Erro de build

**Solução:** 
1. Verifique os logs no painel do Vercel
2. Teste localmente com `npm start`
3. Certifique-se de que o Node.js versão 18+ está sendo usado

## 🌐 Domínio Customizado

1. No painel do Vercel, vá em "Settings" > "Domains"
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções

## 📊 Monitoramento

O Vercel fornece:
- Logs em tempo real
- Analytics de performance
- Métricas de uso
- Alertas de erro

## ✅ Checklist de Deploy

- [ ] Código commitado no Git
- [ ] `package.json` com todas as dependências
- [ ] `vercel.json` configurado
- [ ] Variáveis de ambiente definidas
- [ ] Testado localmente (`npm start`)
- [ ] Build sem erros
- [ ] Assets copiados para `public/`
- [ ] Rotas funcionando corretamente

## 🚀 Após o Deploy

1. Teste todas as rotas principais
2. Verifique se os assets carregam
3. Teste o formulário de agendamento
4. Configure domínio customizado (opcional)
5. Configure variáveis de ambiente de produção

## 📞 Suporte

- Documentação Vercel: https://vercel.com/docs
- Comunidade: https://github.com/vercel/vercel/discussions


