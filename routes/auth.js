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

// Página de esqueci a senha
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', {
    error: null,
    success: null,
    title: 'Recuperar Senha - Amigo e Secreto'
  });
});

// Processar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Verificar se o email existe
    const [users] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.render('auth/forgot-password', {
        error: 'Email não encontrado',
        success: null,
        title: 'Recuperar Senha - Amigo e Secreto'
      });
    }
    
    // Gerar token de reset
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hora
    
    // Salvar token no banco
    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [resetToken, expires, email]
    );
    
    // TODO: Enviar email com link de reset
    // Por enquanto, apenas mostrar mensagem de sucesso
    console.log(`🔑 Token de reset para ${email}: ${resetToken}`);
    
    res.render('auth/forgot-password', {
      error: null,
      success: 'Se o email existir em nossa base, você receberá instruções para recuperar sua senha.',
      title: 'Recuperar Senha - Amigo e Secreto'
    });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.render('auth/forgot-password', {
      error: 'Erro ao processar solicitação',
      success: null,
      title: 'Recuperar Senha - Amigo e Secreto'
    });
  }
});

// Página de reset de senha (com token)
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    // Verificar token válido
    const [users] = await pool.query(
      'SELECT id, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    
    if (users.length === 0) {
      return res.render('auth/reset-password', {
        error: 'Link inválido ou expirado',
        token: null,
        title: 'Redefinir Senha - Amigo e Secreto'
      });
    }
    
    res.render('auth/reset-password', {
      error: null,
      token: token,
      title: 'Redefinir Senha - Amigo e Secreto'
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.render('auth/reset-password', {
      error: 'Erro ao processar solicitação',
      token: null,
      title: 'Redefinir Senha - Amigo e Secreto'
    });
  }
});

// Processar reset de senha
router.post('/reset-password', async (req, res) => {
  const { token, password, confirm_password } = req.body;
  
  try {
    if (password !== confirm_password) {
      return res.render('auth/reset-password', {
        error: 'As senhas não coincidem',
        token: token,
        title: 'Redefinir Senha - Amigo e Secreto'
      });
    }
    
    // Verificar token válido
    const [users] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    
    if (users.length === 0) {
      return res.render('auth/reset-password', {
        error: 'Link inválido ou expirado',
        token: null,
        title: 'Redefinir Senha - Amigo e Secreto'
      });
    }
    
    // Atualizar senha
    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [password, users[0].id]
    );
    
    res.redirect('/login?success=Senha alterada com sucesso');
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.render('auth/reset-password', {
      error: 'Erro ao processar solicitação',
      token: token,
      title: 'Redefinir Senha - Amigo e Secreto'
    });
  }
});

module.exports = router;


