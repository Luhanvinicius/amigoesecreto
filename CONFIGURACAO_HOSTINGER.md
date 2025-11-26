# 🔧 Configuração MySQL Hostinger

## 📍 Informações do Servidor MySQL

Baseado no painel do Hostinger, você tem:

- **Hostname MySQL:** `srv848.hstgr.io`
- **IP MySQL:** `45.132.157.52`
- **Database:** `u342978456_appamigo`
- **User:** `u342978456_appamigo`
- **Password:** `+eO8dj=f@T`

## 🎯 Duas Situações Diferentes

### ✅ Situação 1: Rodar Node.js NO SERVIDOR Hostinger (RECOMENDADO)

**Vantagens:**
- ✅ Mais rápido
- ✅ Não precisa configurar conexão remota
- ✅ Mais seguro
- ✅ Sem problemas de firewall

**Configuração:**
1. **NÃO precisa** criar conexão remota no painel
2. Use no código: `host: 'localhost'` ou `host: '127.0.0.1'`
3. O arquivo `.env` deve ter:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   ```

**Como fazer:**
- Faça upload do código para o servidor Hostinger
- Execute o Node.js no servidor
- Use `localhost` como host

---

### ⚠️ Situação 2: Rodar Node.js NA SUA MÁQUINA LOCAL

**Desvantagens:**
- ⚠️ Mais lento (conexão remota)
- ⚠️ Precisa configurar conexão remota
- ⚠️ Pode ter problemas de firewall
- ⚠️ Menos seguro

**Configuração:**

#### Passo 1: Criar Conexão Remota no Painel Hostinger

1. Acesse o painel Hostinger
2. Vá em: **Websites → Databases → Remote MySQL**
3. Na página "Create remote database connection":
   - **IP (IPv4 or IPv6):** Adicione seu IP público
     - Para descobrir seu IP: https://www.meuip.com.br
     - Ou marque "Any Host" (menos seguro, permite qualquer IP)
   - **Database:** Selecione `u342978456_appamigo`
   - Clique em **"Create"**

#### Passo 2: Configurar o Código

1. Crie/edite o arquivo `.env`:
   ```env
   DB_HOST=srv848.hstgr.io
   # ou use o IP:
   # DB_HOST=45.132.157.52
   DB_PORT=3306
   ```

2. Ou edite `config/database.js` diretamente:
   ```javascript
   host: 'srv848.hstgr.io', // ou '45.132.157.52'
   ```

#### Passo 3: Testar

```bash
node scripts/init-db.js
```

---

## 🚀 Recomendação

**Para produção, recomendo rodar no servidor Hostinger:**

1. Faça upload do código para o servidor
2. Use `localhost` como host
3. Execute o Node.js no servidor
4. Mais rápido e seguro

**Para desenvolvimento local:**

1. Crie a conexão remota no painel
2. Use `srv848.hstgr.io` como host
3. Adicione seu IP na lista de IPs permitidos

---

## 📝 Resumo Rápido

| Onde roda | Host MySQL | Precisa Remote MySQL? |
|-----------|------------|----------------------|
| **Servidor Hostinger** | `localhost` | ❌ NÃO |
| **Sua máquina local** | `srv848.hstgr.io` | ✅ SIM |

---

## 🔍 Descobrir seu IP Público

Para adicionar na lista de IPs permitidos:
- Acesse: https://www.meuip.com.br
- Copie o IP mostrado
- Adicione no campo "IP (IPv4 or IPv6)" do Remote MySQL

---

## ⚠️ Importante

- Se marcar "Any Host", qualquer IP poderá tentar conectar (menos seguro)
- É melhor adicionar apenas seu IP específico
- Se seu IP mudar (ISP dinâmico), precisará atualizar no painel


