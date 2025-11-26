# 🚀 Guia de Deploy no Render

## ✅ Por que Render?

- ✅ **Suporta processos persistentes** (WhatsApp funciona!)
- ✅ **WebSockets e processos longos**
- ✅ **Ambiente similar ao servidor tradicional**
- ✅ **Gratuito** (com algumas limitações)
- ✅ **Deploy automático via GitHub**

---

## 📋 Pré-requisitos

1. **Conta no Render** ([render.com](https://render.com)) - Grátis
2. **Repositório no GitHub** (já temos: `Luhanvinicius/amigoesecreto`)
3. **Variáveis de ambiente** (vamos configurar)

---

## 🔧 Passo 1: Criar Nova Aplicação Web no Render

### 1.1 Acesse Render Dashboard

1. Acesse: https://dashboard.render.com
2. Faça login (pode usar GitHub para login rápido)
3. Clique em **"New +"** no canto superior direito
4. Selecione **"Web Service"**

### 1.2 Conectar Repositório

1. **Connect Repository:**
   - Selecione **"Connect GitHub"** (se ainda não conectou)
   - Autorize o Render a acessar seus repositórios
   - Selecione o repositório: `Luhanvinicius/amigoesecreto`

### 1.3 Configurar Aplicação

Preencha os campos:

- **Name:** `amigoesecreto` (ou o nome que preferir)
- **Region:** `Oregon (US West)` ou `São Paulo (South America)` se disponível
- **Branch:** `main`
- **Root Directory:** `appointment-nodejs` ⚠️ **IMPORTANTE!**
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

### 1.4 Plano

- Selecione: **Free** (para começar)
- ⚠️ **Limitação:** App "spins down" após 15 minutos de inatividade
- Para evitar isso, pode usar serviço de ping ou upgrade para plano pago

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

No painel do Render, vá em **"Environment"** e adicione:

### Banco de Dados MySQL

```
DB_HOST=srv848.hstgr.io
DB_PORT=3306
DB_USER=u342978456_appamigo
DB_PASSWORD=+eO8dj=f@T
DB_NAME=u342978456_appamigo
```

### Sessão

```
SESSION_SECRET=amigo-secreto-render-production-2024-key-ultra-segura-xyz123abc456def789
```

**💡 Gere uma chave aleatória:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Ambiente

```
NODE_ENV=production
PORT=3000
```

### Asaas (Pagamentos)

```
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
```

### WhatsApp

```
ENABLE_WHATSAPP=true
```

**✅ Agora o WhatsApp funcionará!**

---

## 📝 Passo 3: Ajustar Código para Render

O Render funciona diferente do Vercel. Vamos ajustar:

### 3.1 Criar arquivo `render.yaml` (Opcional)

Crie um arquivo `render.yaml` na raiz do projeto para facilitar:

```yaml
services:
  - type: web
    name: amigoesecreto
    runtime: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
    healthCheckPath: /
```

### 3.2 Ajustar `server.js` (se necessário)

Verificar se o servidor inicia corretamente. O Render usa a porta fornecida pela variável `PORT`.

---

## 🚀 Passo 4: Fazer Deploy

1. Clique em **"Create Web Service"**
2. O Render começará o deploy automaticamente
3. Aguarde alguns minutos (primeiro deploy leva mais tempo)
4. Veja os logs em tempo real

---

## 🔍 Passo 5: Verificar Deploy

### 5.1 Logs

- Vá em **"Logs"** no dashboard do Render
- Veja os logs em tempo real
- Procure por:
  - ✅ `Servidor rodando em http://localhost:3000`
  - ✅ `Conexão com MySQL estabelecida com sucesso!`
  - ✅ `WhatsApp inicializando...`

### 5.2 Testar Aplicação

- Acesse a URL fornecida: `https://amigoesecreto.onrender.com`
- Teste as funcionalidades:
  - ✅ Landing page
  - ✅ Login
  - ✅ Criação de agendamentos
  - ✅ WhatsApp (agora funciona!)

---

## ⚙️ Configurações Adicionais

### Health Check

O Render precisa de um endpoint para verificar se a app está rodando. Adicione em `server.js`:

```javascript
// Health check endpoint para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### Evitar "Spin Down" (Free Plan)

O plano gratuito desliga a app após 15 minutos de inatividade. Para evitar:

**Opção 1: Serviço de Ping**
- Use serviços como: https://uptimerobot.com
- Configure para pingar sua URL a cada 10 minutos

**Opção 2: Upgrade para Plano Pago**
- Render oferece planos a partir de $7/mês
- App fica sempre online

### Persistência de Dados

- WhatsApp session será salva no diretório do projeto
- No Render, dados em `/tmp` são temporários
- Para persistência, considere:
  - Render Disk (pago)
  - Ou armazenar session em banco de dados
  - Ou usar serviços externos de storage

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

- Verifique se as variáveis de ambiente estão configuradas
- Verifique se o firewall do MySQL permite conexões do Render
- Render fornece IPs estáticos - adicione ao MySQL

### Erro: "App keeps crashing"

- Verifique os logs no dashboard
- Verifique se a porta está configurada corretamente
- Verifique se todas as dependências estão no `package.json`

### WhatsApp não inicia

- Verifique se `ENABLE_WHATSAPP=true`
- Verifique os logs para erros do Puppeteer
- Render pode precisar de buildpacks específicos para Chrome

### App "spins down" muito rápido

- Use serviço de ping externo
- Ou considere upgrade para plano pago

---

## 📊 Comparação: Vercel vs Render

| Recurso | Vercel | Render |
|---------|--------|--------|
| WhatsApp | ❌ Não funciona | ✅ Funciona |
| Serverless | ✅ Sim | ❌ Não (Web Service) |
| Processos Longos | ❌ Não | ✅ Sim |
| WebSockets | ✅ Sim | ✅ Sim |
| Deploy Automático | ✅ Sim | ✅ Sim |
| Free Tier | ✅ Sempre online | ⚠️ Spins down após 15min |
| Plano Pago | $20+/mês | $7+/mês |

---

## ✅ Checklist Final

- [ ] Conta no Render criada
- [ ] Repositório conectado
- [ ] Aplicação Web criada
- [ ] Root Directory configurado: `appointment-nodejs`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server.js`
- [ ] Todas as variáveis de ambiente configuradas
- [ ] `ENABLE_WHATSAPP=true` configurado
- [ ] Firewall MySQL liberado para IPs do Render
- [ ] Deploy realizado
- [ ] Logs verificados
- [ ] Aplicação testada

---

## 🆘 Suporte

- [Documentação Render](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Status Render](https://status.render.com)

---

## 🎯 Próximos Passos

1. Criar aplicação no Render
2. Configurar variáveis de ambiente
3. Fazer primeiro deploy
4. Testar WhatsApp
5. Configurar serviço de ping (se necessário)

**Boa sorte! 🚀**


