# 🚀 Guia de Deploy no Vercel

## ⚠️ IMPORTANTE: Limitações Conhecidas

Este projeto possui algumas limitações para deploy no Vercel:

### 1. **WhatsApp Web.js não funciona no Vercel**
- O WhatsApp Web.js usa **Puppeteer** que **NÃO funciona** em funções serverless do Vercel
- Puppeteer requer um ambiente com Chrome/Chromium completo
- **Solução:** Desabilitar a funcionalidade WhatsApp ou usar uma API externa

### 2. **Sessões precisam de store externo**
- O Vercel usa funções serverless (sem estado persistente)
- Sessões em memória não funcionam entre requisições
- **Solução:** Usar Redis ou outro store externo

### 3. **Tamanho do pacote**
- O projeto é grande (inclui assets estáticos)
- Pode exceder limites do Vercel (50MB por função)
- **Solução:** Otimizar assets ou usar CDN

---

## 📋 Pré-requisitos

1. **Conta no Vercel** ([vercel.com](https://vercel.com))
2. **CLI do Vercel** (opcional):
   ```bash
   npm i -g vercel
   ```
3. **Variáveis de ambiente configuradas**

---

## 🔧 Configuração do Projeto

### 1. Ajustar `vercel.json`

O arquivo já está configurado, mas vamos melhorá-lo:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/public/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/assets/(.*)",
      "dest": "/public/assets/$1"
    },
    {
      "src": "/images/(.*)",
      "dest": "/public/images/$1"
    },
    {
      "src": "/js/(.*)",
      "dest": "/public/js/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Variáveis de Ambiente no Vercel

Acesse: **Dashboard → Seu Projeto → Settings → Environment Variables**

Configure as seguintes variáveis:

```
# Banco de Dados
DB_HOST=srv848.hstgr.io
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_database

# Sessão (obrigatório em produção)
SESSION_SECRET=uma-chave-secreta-muito-segura-aqui-aleatoria

# Ambiente
NODE_ENV=production
PORT=3000

# Asaas (se usar)
ASAAS_API_KEY=sua_chave_api
ASAAS_ENVIRONMENT=production

# Outras configurações
ENABLE_WHATSAPP=false  # Desabilitar WhatsApp no Vercel
```

### 3. Desabilitar WhatsApp no Vercel

Edite `server.js` para não inicializar WhatsApp em produção no Vercel:

```javascript
// No final do server.js, antes do module.exports
if (process.env.VERCEL || process.env.ENABLE_WHATSAPP === 'false') {
  console.log('⚠️ WhatsApp desabilitado (ambiente Vercel)');
} else if (process.env.NODE_ENV !== 'production') {
  // Inicializar WhatsApp apenas em desenvolvimento local
}
```

---

## 📦 Deploy via CLI

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Login
```bash
vercel login
```

### 3. Deploy
```bash
cd appointment-nodejs
vercel
```

### 4. Deploy de Produção
```bash
vercel --prod
```

---

## 🌐 Deploy via GitHub (Recomendado)

### 1. Criar repositório no GitHub

```bash
cd appointment-nodejs
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

### 2. Conectar no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"Add New Project"**
3. Importe seu repositório GitHub
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `appointment-nodejs`
   - **Build Command:** (deixe vazio ou `npm run build`)
   - **Output Directory:** (deixe vazio)
   - **Install Command:** `npm install`

### 3. Configurar Variáveis de Ambiente

No painel do Vercel, adicione todas as variáveis necessárias.

### 4. Deploy Automático

O Vercel fará deploy automático a cada push no GitHub!

---

## 🔍 Verificações Pós-Deploy

### 1. Testar rotas principais:
- `/` - Landing page
- `/admin/login` - Login admin
- `/dashboard` - Dashboard cliente
- `/appointments/:slug` - Formulário de agendamento

### 2. Verificar logs:
- Dashboard Vercel → Seu Projeto → Logs

### 3. Testar funcionalidades:
- ✅ Login/Logout
- ✅ Criação de agendamentos
- ✅ Pagamento PIX
- ❌ WhatsApp (desabilitado no Vercel)

---

## 🐛 Troubleshooting

### Erro: "Function exceeded maximum duration"
- Ajuste `maxDuration` no `vercel.json`
- Ou otimize queries de banco de dados

### Erro: "Module not found"
- Verifique se todas as dependências estão em `package.json`
- Execute `npm install` localmente e verifique erros

### Erro: "Cannot connect to database"
- Verifique variáveis de ambiente
- Verifique se o IP do Vercel está liberado no MySQL
- Use conexões SSL se necessário

### Arquivos estáticos não carregam
- Verifique rotas no `vercel.json`
- Verifique caminhos nos templates EJS

### Sessões não persistem
- Configure Redis ou outro store
- Use cookies assinados

---

## 🎯 Alternativas ao Vercel

Para este tipo de aplicação, considere:

1. **Railway** - Melhor para Node.js com Puppeteer
2. **Render** - Suporta aplicações longas
3. **Heroku** - Clássico, mas pago
4. **DigitalOcean App Platform** - Bom custo-benefício
5. **Hostinger/VPS tradicional** - Controle total

---

## 📝 Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] WhatsApp desabilitado (se necessário)
- [ ] Banco de dados acessível do Vercel
- [ ] Arquivos estáticos servindo corretamente
- [ ] Rotas testadas
- [ ] Logs verificados
- [ ] Sessões funcionando (ou Redis configurado)

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs no dashboard do Vercel
2. Teste localmente primeiro
3. Verifique documentação do Vercel: [vercel.com/docs](https://vercel.com/docs)

