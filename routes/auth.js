const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Página de login
router.get('/login', (req, res) => {
  const redirect = req.query.redirect || '/dashboard';
  res.render('auth/login', { 
    error: null, 
    redirect: redirect,
    title: 'Login - Amigo e Secreto'
  });
});

// Processar login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const redirect = req.query.redirect || req.body.redirect || '/dashboard';
  
  console.log('🔐 Tentativa de login:', { email, hasPassword: !!password });
  
  try {
    if (!email || !password) {
      console.log('⚠️ Login falhou: Email ou senha faltando');
      return res.render('auth/login', {
        error: 'Email e senha são obrigatórios',
        redirect: redirect,
        title: 'Login - Amigo e Secreto'
      });
    }
    
    // Buscar usuário
    console.log('🔍 Buscando usuário no banco de dados...');
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    
    console.log('📊 Usuários encontrados:', users.length);
    
    if (users.length === 0) {
      console.log('❌ Login falhou: Credenciais incorretas');
      return res.render('auth/login', {
        error: 'Email ou senha incorretos',
        redirect: redirect,
        title: 'Login - Amigo e Secreto'
      });
    }
    
    const user = users[0];
    console.log('✅ Usuário encontrado:', { id: user.id, email: user.email, role: user.role });
    
    // Salvar sessão ANTES de redirecionar
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    
    // Forçar salvamento da sessão
    req.session.save((err) => {
      if (err) {
        console.error('❌ Erro ao salvar sessão:', err);
        return res.render('auth/login', {
          error: 'Erro ao criar sessão. Verifique SESSION_SECRET.',
          redirect: redirect,
          title: 'Login - Amigo e Secreto'
        });
      }
      
      console.log('✅ Sessão salva com sucesso:', {
        sessionId: req.sessionID,
        userId: req.session.userId,
        role: req.session.userRole
      });
      
      // Redirecionar baseado no role
      const redirectPath = user.role === 'admin' 
        ? (redirect.startsWith('/admin') ? redirect : '/admin/dashboard')
        : (redirect.startsWith('/dashboard') ? redirect : '/dashboard');
      
      console.log('🔄 Redirecionando para:', redirectPath);
      return res.redirect(redirectPath);
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    console.error('Stack:', error.stack);
    return res.render('auth/login', {
      error: 'Erro ao processar login. Tente novamente.',
      redirect: redirect,
      title: 'Login - Amigo e Secreto'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;


