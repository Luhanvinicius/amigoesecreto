# 🔐 Variáveis de Ambiente para Vercel

## 📋 Lista Completa de Variáveis

Copie e cole estas variáveis no painel do Vercel:
**Settings → Environment Variables → Add New**

---

### 🗄️ **Banco de Dados MySQL (Hostinger)**

```
DB_HOST=srv848.hstgr.io
DB_PORT=3306
DB_USER=u342978456_appamigo
DB_PASSWORD=+eO8dj=f@T
DB_NAME=u342978456_appamigo
```

**⚠️ IMPORTANTE:** 
- Libere os IPs do Vercel no firewall do MySQL Hostinger
- Ou permita conexões de qualquer IP (menos seguro)

---

### 🔐 **Sessão e Segurança**

```
SESSION_SECRET=amigo-secreto-vercel-production-2024-key-ultra-segura-xyz123abc456def789
```

**💡 Dica:** Gere uma chave aleatória segura:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Ou use este gerador online: https://www.random.org/strings/

**Recomendação:** Use pelo menos 64 caracteres aleatórios.

---

### 🌍 **Ambiente e Porta**

```
NODE_ENV=production
PORT=3000
```

**💡 Nota:** O Vercel define a porta automaticamente, mas pode manter `PORT=3000` para compatibilidade.

---

### 💳 **Asaas (Pagamentos PIX)**

```
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
```

**⚠️ IMPORTANTE:**
- Este é o token de **SANDBOX/TESTE** (começa com `$aact_hmlg_`)
- Para produção, substitua pelo token **REAL** (começa com `$aact_YTU5YTE0M2M2N2I4MTliNzk0Yzg5N2`)
- O token DEVE começar com `$` (obrigatório)
- Obtenha o token em: https://www.asaas.com/configuracoes/api-keys

**Para Ambiente de Produção (quando tiver):**
```
ASAAS_ENVIRONMENT=production
```

---

### 📱 **WhatsApp (Desabilitado no Vercel)**

```
ENABLE_WHATSAPP=false
```

**⚠️ IMPORTANTE:**
- WhatsApp **NÃO funciona** no Vercel (Puppeteer não suportado)
- Mantenha como `false` para evitar erros
- Se precisar de WhatsApp, use Railway, Render ou VPS

---

### 🚀 **Vercel (Automático)**

```
VERCEL=true
```

**💡 Nota:** Esta variável é definida automaticamente pelo Vercel. Você pode ignorá-la.

---

## 📝 **Configuração Rápida no Vercel**

### Método 1: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → Environment Variables**
4. Clique em: **Add New**
5. Adicione cada variável uma por uma:

**Passo 1 - Banco de Dados:**
```
Key: DB_HOST
Value: srv848.hstgr.io
Environment: Production, Preview, Development (selecione todos)
```

```
Key: DB_PORT
Value: 3306
Environment: Production, Preview, Development
```

```
Key: DB_USER
Value: u342978456_appamigo
Environment: Production, Preview, Development
```

```
Key: DB_PASSWORD
Value: +eO8dj=f@T
Environment: Production, Preview, Development
```

```
Key: DB_NAME
Value: u342978456_appamigo
Environment: Production, Preview, Development
```

**Passo 2 - Sessão:**
```
Key: SESSION_SECRET
Value: [GERE_UMA_CHAVE_ALEATORIA_AQUI]
Environment: Production, Preview, Development
```

**Passo 3 - Ambiente:**
```
Key: NODE_ENV
Value: production
Environment: Production, Preview, Development
```

```
Key: PORT
Value: 3000
Environment: Production, Preview, Development
```

**Passo 4 - Asaas:**
```
Key: ASAAS_API_KEY
Value: $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
Environment: Production, Preview, Development
```

**Passo 5 - WhatsApp:**
```
Key: ENABLE_WHATSAPP
Value: false
Environment: Production, Preview, Development
```

---

### Método 2: Via CLI (Avançado)

Crie um arquivo `.env.production` e depois use:

```bash
vercel env add DB_HOST production
vercel env add DB_PORT production
vercel env add DB_USER production
vercel env add DB_PASSWORD production
vercel env add DB_NAME production
vercel env add SESSION_SECRET production
vercel env add NODE_ENV production
vercel env add PORT production
vercel env add ASAAS_API_KEY production
vercel env add ENABLE_WHATSAPP production
```

---

## ✅ **Checklist de Configuração**

- [ ] Todas as variáveis de banco de dados adicionadas
- [ ] `SESSION_SECRET` gerado e configurado (chave aleatória forte)
- [ ] `NODE_ENV` configurado como `production`
- [ ] `ASAAS_API_KEY` configurado (sandbox ou produção)
- [ ] `ENABLE_WHATSAPP` configurado como `false`
- [ ] Firewall do MySQL Hostinger liberado para IPs do Vercel
- [ ] Variáveis configuradas para **Production**, **Preview** e **Development**

---

## 🔍 **Como Verificar se Está Funcionando**

Após configurar as variáveis:

1. Faça um novo deploy no Vercel
2. Acesse os logs do projeto
3. Procure por:
   - ✅ `Conexão com MySQL estabelecida com sucesso!`
   - ✅ `Servidor rodando`
   - ❌ Sem erros de conexão com banco

---

## 🆘 **Problemas Comuns**

### Erro: "Cannot connect to database"
- Verifique se todos os IPs do Vercel estão liberados no firewall MySQL
- Confirme se as credenciais estão corretas
- Teste a conexão manualmente com um cliente MySQL

### Erro: "Invalid session secret"
- Gere uma nova chave `SESSION_SECRET` com pelo menos 64 caracteres
- Certifique-se de que não há espaços extras na configuração

### Erro: "Asaas API error"
- Verifique se o token começa com `$`
- Confirme se o token não expirou
- Verifique se está usando o token correto (sandbox vs produção)

---

## 📞 **Suporte**

- [Documentação Vercel](https://vercel.com/docs/environment-variables)
- [Hostinger MySQL Remote Access](https://www.hostinger.com/tutorials/how-to-enable-remote-mysql-access)

---

## 🔄 **Resumo Rápido (Copiar e Colar)**

Se preferir, aqui está um resumo para copiar todas de uma vez:

```
DB_HOST=srv848.hstgr.io
DB_PORT=3306
DB_USER=u342978456_appamigo
DB_PASSWORD=+eO8dj=f@T
DB_NAME=u342978456_appamigo
SESSION_SECRET=[GERE_UMA_CHAVE_ALEATORIA_AQUI]
NODE_ENV=production
PORT=3000
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
ENABLE_WHATSAPP=false
```

**⚠️ Lembre-se:** Substitua `[GERE_UMA_CHAVE_ALEATORIA_AQUI]` por uma chave real!


