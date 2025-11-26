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
  
  try {
    if (!email || !password) {
      return res.render('auth/login', {
        error: 'Email e senha são obrigatórios',
        redirect: redirect,
        title: 'Login - Amigo e Secreto'
      });
    }
    
    // Buscar usuário com retry automático
    let users;
    try {
      [users] = await pool.query(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );
    } catch (dbError) {
      // Se for erro de conexão, tentar novamente
      if (dbError.code === 'ECONNRESET' || dbError.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Reconectando e tentando novamente...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        [users] = await pool.query(
          'SELECT * FROM users WHERE email = ? AND password = ?',
          [email, password]
        );
      } else {
        throw dbError;
      }
    }
    
    if (users.length === 0) {
      return res.render('auth/login', {
        error: 'Email ou senha incorretos',
        redirect: redirect,
        title: 'Login - Amigo e Secreto'
      });
    }
    
    const user = users[0];
    
    // Criar sessão
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    
    // Redirecionar baseado no role
    if (user.role === 'admin') {
      return res.redirect(redirect.startsWith('/admin') ? redirect : '/admin/dashboard');
    } else {
      return res.redirect(redirect.startsWith('/dashboard') ? redirect : '/dashboard');
    }
  } catch (error) {
    console.error('Erro no login:', error);
    
    // Tratamento específico para erros de conexão MySQL
    if (error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('❌ Erro de conexão MySQL. Verifique as configurações do banco de dados.');
      return res.render('auth/login', {
        error: 'Erro de conexão com o banco de dados. Tente novamente em alguns instantes.',
        redirect: redirect,
        title: 'Login - Amigo e Secreto'
      });
    }
    
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


