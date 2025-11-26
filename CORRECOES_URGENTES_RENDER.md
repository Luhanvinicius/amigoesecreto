# ⚠️ CORREÇÕES URGENTES PARA RENDER

## 🔴 PROBLEMA 1: Token Asaas Inválido

**Erro:** `invalid_access_token_format`

**Causa:** O token pode estar incompleto ou mal formatado no Render

**Solução:**
1. Vá em Render Dashboard → Environment Variables
2. Encontre `ASAAS_API_KEY`
3. **DELETE** a variável atual
4. **ADICIONE NOVAMENTE** com o token COMPLETO abaixo:

```
$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNrdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
```

⚠️ **IMPORTANTE:** 
- Copie o token COMPLETO (deve ter ~150 caracteres)
- NÃO deve ter espaços no início ou fim
- DEVE começar com `$`

---

## 🔴 PROBLEMA 2: Imagens Não Encontradas

**Erro:** `GET /images/uploads/...` - 404

**Causa:** As imagens podem não existir ou a rota está incorreta

**Solução:** As imagens estão sendo servidas, mas podem não existir no repositório.

**Verificar:**
- Se as imagens existem em `public/images/uploads/`
- Se não existirem, adicione-as ao repositório ou remova as referências

---

## 🔴 PROBLEMA 3: Login Não Funciona

**Causa:** Pode ser problema de sessão ou redirecionamento

**Solução Temporária:**
- Verifique se `SESSION_SECRET` está configurado
- Verifique os logs do Render após tentar fazer login

---

## 🚀 AÇÃO IMEDIATA

1. **CORRIGIR TOKEN ASAAS** (Mais importante!)
   - Delete e readicione a variável `ASAAS_API_KEY`
   - Cole o token completo

2. **FAZER REDEPLOY**
   - Após corrigir o token, o Render fará redeploy automático
   - Aguarde o deploy concluir

3. **TESTAR NOVAMENTE**

---

## 📋 Token Asaas Completo Para Copiar

```
$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNrdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj
```

**Copie este token COMPLETO e cole no Render!**

