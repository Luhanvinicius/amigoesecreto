# ✅ Checklist para Deploy no Vercel

## Antes do Deploy

### 1. Variáveis de Ambiente
- [ ] `DB_HOST` - Host do banco MySQL
- [ ] `DB_PORT` - Porta do banco (geralmente 3306)
- [ ] `DB_USER` - Usuário do banco
- [ ] `DB_PASSWORD` - Senha do banco
- [ ] `DB_NAME` - Nome do banco
- [ ] `SESSION_SECRET` - Chave secreta para sessões (gerar aleatória)
- [ ] `NODE_ENV=production`
- [ ] `ENABLE_WHATSAPP=false` - Desabilitar WhatsApp (não funciona no Vercel)
- [ ] `ASAAS_API_KEY` - Se usar Asaas para pagamentos
- [ ] `ASAAS_ENVIRONMENT=production` - Se usar Asaas

### 2. Configuração do Banco de Dados
- [ ] Liberar IPs do Vercel no firewall do MySQL
- [ ] Ou permitir conexões de qualquer IP (menos seguro)
- [ ] Testar conexão remota do banco

### 3. Arquivos do Projeto
- [ ] `vercel.json` configurado corretamente
- [ ] `package.json` com todas as dependências
- [ ] `.vercelignore` configurado
- [ ] `server.js` exporta o app corretamente

### 4. WhatsApp (Desabilitar)
- [ ] Confirmar que WhatsApp está desabilitado
- [ ] Testar que rotas do WhatsApp retornam mensagem apropriada
- [ ] Ou implementar fallback para funcionalidade WhatsApp

## Durante o Deploy

### 1. Primeiro Deploy
- [ ] Conectar repositório GitHub no Vercel
- [ ] Configurar Root Directory: `appointment-nodejs`
- [ ] Adicionar todas as variáveis de ambiente
- [ ] Fazer deploy inicial
- [ ] Verificar logs do build

### 2. Verificações Pós-Deploy
- [ ] Build concluído com sucesso
- [ ] Sem erros nos logs
- [ ] URL do projeto funcionando

## Após o Deploy

### 1. Testes Funcionais
- [ ] `/` - Landing page carrega
- [ ] `/admin/login` - Login admin funciona
- [ ] `/dashboard` - Dashboard cliente funciona (após login)
- [ ] `/appointments/:slug` - Formulário de agendamento funciona
- [ ] Criar agendamento de teste
- [ ] Pagamento PIX funciona (se configurado)
- [ ] Arquivos estáticos (CSS, JS, imagens) carregam

### 2. Testes de Performance
- [ ] Páginas carregam em menos de 3 segundos
- [ ] Assets estáticos são servidos rapidamente
- [ ] Sem erros 500 no console do navegador

### 3. Segurança
- [ ] HTTPS habilitado (automático no Vercel)
- [ ] Sessões funcionando corretamente
- [ ] Cookies seguros configurados

## Problemas Comuns

### Erro: Cannot connect to database
- [ ] Verificar variáveis de ambiente do banco
- [ ] Verificar se IP do Vercel está liberado
- [ ] Testar conexão manualmente

### Erro: Assets não carregam
- [ ] Verificar rotas no `vercel.json`
- [ ] Verificar caminhos nos templates EJS
- [ ] Verificar se arquivos estão no diretório correto

### Erro: Sessões não funcionam
- [ ] Verificar `SESSION_SECRET` configurado
- [ ] Considerar usar Redis para produção
- [ ] Verificar configuração de cookies

### Erro: WhatsApp não funciona
- [ ] ✅ Esperado! WhatsApp não funciona no Vercel (Puppeteer)
- [ ] Desabilitar funcionalidade ou usar API externa

## Próximos Passos

- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar CDN para assets (opcional)
- [ ] Configurar monitoramento de erros (opcional)
- [ ] Configurar backups do banco de dados
- [ ] Documentar processo de deploy para a equipe

## Comandos Úteis

```bash
# Deploy via CLI
vercel

# Deploy de produção
vercel --prod

# Ver logs
vercel logs

# Listar projetos
vercel list

# Remover deploy
vercel remove
```

## Suporte

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel Status](https://vercel-status.com)
- Logs do projeto no dashboard do Vercel


