# Configuração MySQL e Asaas

## 📋 Pré-requisitos

1. MySQL instalado e rodando
2. Banco de dados criado: `u342978456_appamigo`
3. Node.js e npm instalados

## 🗄️ Configuração do Banco de Dados

### Credenciais MySQL
- **Host:** localhost
- **Usuário:** u342978456_appamigo
- **Senha:** +eO8dj=f@T
- **Database:** u342978456_appamigo

### Inicializar Tabelas

Execute o script para criar todas as tabelas necessárias:

```bash
node scripts/init-db.js
```

Ou diretamente:

```bash
node config/create-tables.js
```

Isso criará as seguintes tabelas:
- `users` - Usuários do sistema
- `services` - Serviços disponíveis
- `locations` - Localizações (Instagram, WhatsApp, etc)
- `appointments` - Agendamentos

E inserirá os dados padrão de serviços e localizações.

## 💳 Configuração Asaas

O sistema está configurado para usar o **Asaas Sandbox** com o token fornecido.

### Token Asaas (Sandbox)
```
$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
```

### Funcionalidades Implementadas

1. **Criação de Cliente no Asaas** - Automaticamente ao criar agendamento
2. **Pagamento PIX** - Geração automática de pagamento PIX
3. **Redirecionamento** - Após criar agendamento, redireciona para página de pagamento

## 🚀 Como Usar

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Inicializar banco de dados:**
   ```bash
   node scripts/init-db.js
   ```

3. **Iniciar servidor:**
   ```bash
   npm start
   # ou para desenvolvimento
   npm run dev
   ```

4. **Acessar o sistema:**
   - Landing Page: http://localhost:3000
   - Formulário: http://localhost:3000/appointments/amigo-secreto

## 📝 Fluxo de Agendamento

1. Usuário seleciona um plano na landing page
2. Preenche o formulário de agendamento
3. Seleciona data e horário
4. Preenche dados pessoais
5. Sistema cria:
   - Usuário no banco (se novo)
   - Agendamento no banco
   - Cliente no Asaas
   - Pagamento PIX no Asaas
6. Redireciona para página de pagamento do Asaas

## 🔧 Estrutura de Arquivos

```
appointment-nodejs/
├── config/
│   ├── database.js          # Configuração MySQL
│   ├── create-tables.js     # Script de criação de tabelas
│   └── asaas.js             # Integração Asaas
├── controllers/
│   └── appointmentController.js  # Lógica de negócio
├── routes/
│   ├── appointment.js       # Rotas de agendamento
│   └── api.js              # Rotas de API
└── scripts/
    └── init-db.js          # Script de inicialização
```

## ⚠️ Notas Importantes

- O sistema está usando **Asaas Sandbox** (ambiente de testes)
- Para produção, altere o token e URL no arquivo `config/asaas.js`
- As senhas de usuários não estão sendo hasheadas (implementar bcrypt para produção)
- O campo "Funcionários" foi removido conforme solicitado



