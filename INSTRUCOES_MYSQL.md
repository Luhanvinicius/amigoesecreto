# 🔧 Instruções para Configurar MySQL

## ❌ Erro: ECONNREFUSED

O erro `ECONNREFUSED` indica que o sistema não consegue conectar ao MySQL. Isso pode acontecer por alguns motivos:

### 1. MySQL não está rodando localmente

Se você está usando um **servidor MySQL remoto** (hosting compartilhado), você precisa configurar o host correto.

### 2. Configurar Host do Banco de Dados

Para servidores de hosting compartilhado (como Hostinger, HostGator, etc.), o host geralmente **NÃO é `localhost`**.

#### Opções comuns de host:

1. **IP do servidor** (ex: `185.201.11.xxx`)
2. **Hostname específico** (ex: `mysql.hostinger.com` ou `mysql.seuprovedor.com`)
3. **localhost** (apenas se o MySQL estiver na mesma máquina)

### 3. Como descobrir o host correto:

1. **Painel de controle do hosting:**
   - Acesse o cPanel ou painel do seu provedor
   - Vá em "Bancos de Dados MySQL" ou "MySQL Databases"
   - Procure por "Host" ou "Server"
   - Geralmente aparece algo como: `mysql.hostinger.com` ou um IP

2. **Arquivo de configuração do WordPress:**
   - Se você tem um WordPress no mesmo servidor, abra o `wp-config.php`
   - Procure por `DB_HOST` - esse é o host correto

### 4. Configurar no projeto:

**Opção A: Usar arquivo .env (Recomendado)**

1. Crie um arquivo `.env` na raiz do projeto:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e configure:
   ```env
   DB_HOST=seu-host-mysql-aqui.com
   DB_PORT=3306
   ```

**Opção B: Editar diretamente o arquivo**

Edite `config/database.js` e altere:
```javascript
host: 'seu-host-mysql-aqui.com', // Substitua pelo host correto
```

### 5. Exemplos de configuração:

#### Hostinger:
```javascript
host: 'localhost', // ou o IP fornecido no painel
```

#### HostGator:
```javascript
host: 'localhost', // geralmente é localhost mesmo
```

#### Servidor dedicado/VPS:
```javascript
host: 'localhost', // ou o IP do servidor
```

### 6. Testar conexão:

Após configurar, teste novamente:
```bash
node scripts/init-db.js
```

### 7. Verificar se MySQL está rodando:

Se for servidor local, verifique se o MySQL está rodando:
```bash
# Windows
net start MySQL

# Linux/Mac
sudo systemctl status mysql
# ou
sudo service mysql status
```

### 8. Firewall/Porta:

Certifique-se de que a porta 3306 está aberta (para servidores remotos, pode ser necessário abrir no firewall do hosting).

### 9. Credenciais corretas:

Verifique se as credenciais estão corretas:
- Usuário: `u342978456_appamigo`
- Senha: `+eO8dj=f@T`
- Database: `u342978456_appamigo`

### 10. Contato com suporte:

Se ainda não funcionar, entre em contato com o suporte do seu provedor de hosting e pergunte:
- "Qual é o hostname do servidor MySQL?"
- "A porta 3306 está aberta para conexões remotas?"

---

## ✅ Após configurar corretamente:

Execute novamente:
```bash
node scripts/init-db.js
```

Você deve ver:
```
✅ Conexão com MySQL estabelecida com sucesso!
📊 Criando tabelas no banco de dados...
✅ Tabela users criada
✅ Tabela services criada
✅ Tabela locations criada
✅ Tabela appointments criada
✅ Serviços padrão inseridos
✅ Localizações padrão inseridas
🎉 Todas as tabelas foram criadas com sucesso!
```


