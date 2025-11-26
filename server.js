const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'amigo-secreto-session-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para disponibilizar dados do usuário nas views
app.use((req, res, next) => {
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    role: req.session.userRole
  } : null;
  next();
});

// Servir arquivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/form_layouts', express.static(path.join(__dirname, 'public/form_layouts')));
app.use('/module_assets', express.static(path.join(__dirname, 'public/module_assets')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// Helper para tradução
const translations = require('./config/translations/pt.json');
const __ = (key) => {
  return translations[key] || key;
};

// Helper para asset paths
const asset = (path) => {
  return `/public/${path}`;
};

// Disponibilizar helpers globalmente para EJS
app.locals.__ = __;
app.locals.asset = asset;

// Rotas
const appointmentRoutes = require('./routes/appointment');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

app.use('/appointments', appointmentRoutes);
app.use('/api', apiRoutes);
app.use('/dashboard', dashboardRoutes); // Prefixo /dashboard para todas as rotas do dashboard (ANTES de authRoutes para evitar conflitos)
app.use('/', authRoutes);
app.use('/admin', adminRoutes);

// Log para debug - listar rotas registradas
console.log('📋 Rotas API registradas:');
apiRoutes.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /api${r.route.path}`);
  }
});

console.log('📋 Rotas Dashboard registradas:');
dashboardRoutes.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`   ${methods} /dashboard${r.route.path}`);
  }
});

// Rota raiz - Landing Page (deve vir DEPOIS das rotas específicas)
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Amigo e Secreto - Precisa de Alguém Para Conversar?'
  });
});

// Middleware de tratamento de erro para rotas não encontradas
// IMPORTANTE: Este middleware deve vir DEPOIS de todas as rotas
app.use((req, res, next) => {
  // Ignorar rotas do DevTools e outras rotas de sistema
  if (req.originalUrl.includes('/.well-known/') || 
      req.originalUrl.includes('/favicon.ico') ||
      req.originalUrl.includes('/devtools') ||
      req.originalUrl.includes('/.well-known/appspecific/')) {
    return res.status(404).end();
  }
  
  // Se alguém tentar acessar /profile diretamente, redirecionar para /dashboard/profile
  if (req.originalUrl === '/profile' && req.method === 'GET') {
    console.log('⚠️ Redirecionando /profile para /dashboard/profile');
    return res.redirect('/dashboard/profile');
  }
  
  // Só logar rotas não encontradas que não sejam de sistema
  if (!req.originalUrl.startsWith('/.well-known') && 
      !req.originalUrl.includes('favicon') &&
      !req.originalUrl.includes('devtools')) {
    console.log('⚠️ Rota não encontrada:', req.method, req.originalUrl);
  }
  
  res.status(404).send(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
});

// Iniciar servidor apenas localmente
// No Vercel, o servidor é gerenciado automaticamente e não precisa de app.listen()
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    
    // Inicializar WhatsApp Service (opcional - pode ser inicializado manualmente)
    // Descomente a linha abaixo se quiser inicializar automaticamente ao iniciar o servidor
    // const whatsappService = require('./services/whatsappService');
    // whatsappService.initialize();
  });
} else {
  // Aviso sobre WhatsApp no Vercel
  console.log('⚠️ WhatsApp desabilitado no Vercel (não suportado em serverless functions)');
}

// Exportar para Vercel
module.exports = app;

