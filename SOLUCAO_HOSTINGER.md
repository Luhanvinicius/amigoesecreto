# 🔧 Solução para Hostinger MySQL

## 📍 Informações do Banco

- **phpMyAdmin:** https://auth-db848.hstgr.io/index.php?db=u342978456_appamigo
- **Database:** u342978456_appamigo
- **User:** u342978456_appamigo
- **Password:** +eO8dj=f@T

## 🔌 Configuração do Host MySQL

Para **Hostinger**, o host do MySQL geralmente é:

### ✅ Opção 1: `localhost` (Recomendado)
Se você está rodando o Node.js **no mesmo servidor** do Hostinger:
```javascript
host: 'localhost'
```

### ✅ Opção 2: `127.0.0.1`
Se `localhost` não funcionar, tente:
```javascript
host: '127.0.0.1'
```

### ⚠️ Conexão Remota
Se você está tentando conectar **de sua máquina local** para o servidor Hostinger:

1. **Verifique se conexões remotas estão habilitadas** no painel Hostinger
2. O host pode ser o IP do servidor ou um hostname específico
3. Pode ser necessário configurar no painel do Hostinger para permitir seu IP

## 🚀 Como Testar

### 1. Edite o arquivo `.env` (ou crie se não existir):

```env
DB_HOST=localhost
DB_PORT=3306
```

### 2. Se `localhost` não funcionar, tente `127.0.0.1`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
```

### 3. Execute o script de inicialização:

```bash
node scripts/init-db.js
```

## 📋 Verificar no Painel Hostinger

1. Acesse o **cPanel** ou **hPanel** do Hostinger
2. Vá em **Bancos de Dados MySQL** ou **MySQL Databases**
3. Procure por informações de conexão:
   - **Host:** Geralmente mostra `localhost` ou `127.0.0.1`
   - **Porta:** Geralmente `3306`

## 🔍 Troubleshooting

### Erro: ECONNREFUSED

**Causa:** O MySQL não está acessível no host/porta especificados.

**Soluções:**
1. ✅ Verifique se está usando `localhost` ou `127.0.0.1`
2. ✅ Verifique se a porta 3306 está correta
3. ✅ Se estiver rodando localmente, verifique se o MySQL está instalado e rodando
4. ✅ Se estiver no servidor Hostinger, certifique-se de que está rodando no servidor, não localmente

### Erro: Access Denied

**Causa:** Credenciais incorretas ou usuário sem permissões.

**Soluções:**
1. ✅ Verifique usuário e senha
2. ✅ Verifique se o usuário tem permissões no banco de dados
3. ✅ No phpMyAdmin, verifique se consegue fazer login com essas credenciais

### Testar Conexão Manualmente

Você pode testar a conexão diretamente no phpMyAdmin:
1. Acesse: https://auth-db848.hstgr.io/index.php?db=u342978456_appamigo
2. Faça login com:
   - Username: `u342978456_appamigo`
   - Password: `+eO8dj=f@T`
3. Se conseguir acessar, as credenciais estão corretas

## 📝 Configuração Atual

O arquivo `config/database.js` está configurado para usar:
- **Host:** `localhost` (pode ser alterado via `.env`)
- **Porta:** `3306` (pode ser alterado via `.env`)
- **User:** `u342978456_appamigo`
- **Password:** `+eO8dj=f@T`
- **Database:** `u342978456_appamigo`

## ✅ Próximos Passos

1. Crie/edite o arquivo `.env` na raiz do projeto
2. Configure `DB_HOST=localhost` ou `DB_HOST=127.0.0.1`
3. Execute: `node scripts/init-db.js`
4. Se funcionar, você verá: `✅ Conexão com MySQL estabelecida com sucesso!`


