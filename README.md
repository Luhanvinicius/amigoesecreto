# Sistema de Agendamento - Node.js

Sistema de agendamento online desenvolvido em Node.js com Express, mantendo layout moderno e funcionalidades completas.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **EJS** - Engine de templates
- **MySQL2** - Driver para MySQL
- **Asaas API** - Gateway de pagamento PIX
- **Vercel** - Plataforma de deploy

## 📁 Estrutura do Projeto

```
appointment-nodejs/
├── config/
│   └── translations/
│       └── pt.json          # Traduções em português
├── controllers/
│   └── appointmentController.js
├── routes/
│   ├── appointment.js       # Rotas de agendamento
│   └── api.js              # Rotas da API
├── views/
│   ├── form_layout/
│   │   ├── layout.ejs      # Layout principal
│   │   └── Formlayout1/
│   │       └── index.ejs   # Formulário de agendamento
│   └── appointment/
│       └── done.ejs         # Página de confirmação
├── public/
│   ├── assets/             # CSS, JS e imagens
│   ├── form_layouts/       # Layouts e estilos do formulário
│   └── module_assets/      # Assets de módulos
├── server.js               # Arquivo principal
├── package.json
└── vercel.json            # Configuração do Vercel
```

## 🛠️ Instalação

1. **Instalar dependências:**
```bash
cd appointment-nodejs
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações.

3. **Executar em desenvolvimento:**
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## 📦 Deploy no Vercel

### Opção 1: Via CLI do Vercel

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Fazer login:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

### Opção 2: Via GitHub

1. Faça push do código para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com)
3. Importe o repositório
4. O Vercel detectará automaticamente a configuração

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=sua_url_do_banco
SESSION_SECRET=seu_secret_key
```

### Rotas Principais

- `/` - Página inicial
- `/appointments/:slug` - Formulário de agendamento
- `/appointments/:slug/done/:id` - Confirmação de agendamento
- `/api/appointments/duration` - API para obter horários disponíveis
- `/api/appointments/staff/data` - API para obter dados do staff

## 📝 Funcionalidades

- ✅ Formulário de agendamento multi-etapas
- ✅ Seleção de serviços, localização e staff
- ✅ Seleção de data e horário
- ✅ Campos customizados
- ✅ Upload de arquivos
- ✅ Registro de novos usuários
- ✅ Login de usuários existentes
- ✅ Reserva como convidado
- ✅ Sistema de pagamento
- ✅ Tradução em português (pt-BR)
- ✅ Layout responsivo idêntico ao original

## 🎨 Layout

O layout foi mantido idêntico ao sistema original, incluindo:
- CSS original do Formlayout1
- JavaScript de interação
- Estrutura HTML preservada
- Assets (imagens, fontes, etc.)

## 🗄️ Banco de Dados

O sistema utiliza MySQL para armazenar:
- Usuários
- Serviços
- Localizações
- Agendamentos
- Dados de pagamento

Configure a conexão no arquivo `.env`:
```env
DB_HOST=srv848.hstgr.io
DB_PORT=3306
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=seu_banco
```

## 📌 Próximos Passos

1. **Conectar banco de dados:**
   - Substituir dados mockados por consultas reais
   - Configurar MongoDB, PostgreSQL ou MySQL

2. **Autenticação:**
   - Implementar sistema de login/registro
   - Adicionar JWT ou sessões

3. **Pagamentos:**
   - Integrar gateway de pagamento
   - Processar transações

4. **Notificações:**
   - Enviar emails de confirmação
   - Notificações push

## 📄 Licença

Este projeto foi desenvolvido em Node.js com Express.

## 🤝 Suporte

Para dúvidas ou problemas, verifique:
- Documentação do Express.js
- Documentação do Vercel
- Issues do repositório

