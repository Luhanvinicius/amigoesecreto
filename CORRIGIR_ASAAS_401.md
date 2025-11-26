# 🔧 Corrigir Erro 401 - Invalid Access Token Format

## ❌ Problema

```
Status: 401
"code": "invalid_access_token_format",
"description": "O valor fornecido não parece ser uma chave de API válida do Asaas. Verifique o formato da sua chave."
```

---

## 🔍 Causa

O token está sendo rejeitado pelo Asaas. Possíveis causas:

1. **Token truncado** - Ao copiar/colar no Render, o token pode ter sido cortado
2. **Espaços ou quebras de linha** - Caracteres invisíveis no token
3. **Token incorreto** - Chave de API errada ou expirada

---

## ✅ SOLUÇÃO

### 1. **Verificar Token no Render**

No Render Dashboard:
1. Vá em: **Environment** → **Environment Variables**
2. Encontre: `ASAAS_API_KEY`
3. **VERIFIQUE:**
   - ✅ O token está COMPLETO? (deve ter ~200+ caracteres)
   - ✅ Começa com `$`?
   - ✅ Não tem espaços ou quebras de linha no meio?

### 2. **Token Correto (Sandbox)**

O token deve ser EXATAMENTE assim (sem espaços, sem quebras):

```
$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
```

### 3. **Como Corrigir no Render**

1. **Delete** a variável `ASAAS_API_KEY` atual
2. **Crie novamente** com o nome: `ASAAS_API_KEY`
3. **Cole o token COMPLETO** (copie do arquivo de variáveis)
4. **NÃO adicione espaços** antes ou depois
5. **Salve**

### 4. **Verificar nos Logs**

Após o redeploy, veja os logs do Render. Deve aparecer:

```
🔑 Ambiente Asaas detectado: SANDBOX (Teste)
🌐 URL da API: https://sandbox.asaas.com/api/v3
🔑 Token Asaas (header): $aact_hmlg_000MzkwODA2MWY2...
📏 Tamanho: 200+ caracteres
```

Se aparecer:
- `📏 Tamanho: 50 caracteres` ou menos → Token está truncado
- `❌ Token Asaas parece estar incompleto` → Token está truncado

---

## 🧪 Teste

1. **Aguarde o redeploy** (1-2 minutos)
2. **Tente gerar um pagamento PIX**
3. **Veja os logs do Render**:
   - Se ainda der 401, o token está incorreto ou truncado
   - Se funcionar, verá: `✅ Cliente no Asaas:` e `📱 QR Code gerado`

---

## 🆘 Se Ainda Não Funcionar

### Opção 1: Gerar Nova Chave no Asaas

1. Acesse: https://sandbox.asaas.com
2. Faça login
3. Vá em: **Integrações** → **API**
4. Gere uma **nova chave de API**
5. Copie a chave COMPLETA
6. Cole no Render (sem espaços)

### Opção 2: Verificar Token Manualmente

No terminal local, teste o token:

```bash
curl -X GET "https://sandbox.asaas.com/api/v3/customers" \
  -H "access_token: $aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj"
```

Se retornar 401, o token está incorreto ou expirado.

---

## 📋 Checklist

- [ ] Token completo no Render (200+ caracteres)
- [ ] Token começa com `$`
- [ ] Sem espaços ou quebras de linha
- [ ] Ambiente detectado como SANDBOX
- [ ] URL correta: `https://sandbox.asaas.com/api/v3`
- [ ] Aguardou redeploy completo
- [ ] Testou gerar pagamento
- [ ] Verificou logs do Render

---

## 💡 Dica

Se o token continuar sendo rejeitado, pode ser que:
- A chave de API foi revogada
- A chave é de produção, não sandbox
- A conta do Asaas sandbox está inativa

Nesse caso, gere uma nova chave no painel do Asaas sandbox.

