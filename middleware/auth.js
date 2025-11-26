const pool = require('../config/database');

// Middleware para verificar se o usuário está autenticado
const requireAuth = async (req, res, next) => {
  try {
    // Verificar tanto req.session.userId quanto req.session.user (compatibilidade)
    const userId = req.session.userId || (req.session.user && req.session.user.id);
    
    if (!req.session || !userId) {
      // Se não está autenticado, redirecionar para login
      if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ success: false, message: 'Não autenticado' });
      }
      // Garantir que o redirect mantenha o caminho completo
      const redirectUrl = req.originalUrl.startsWith('/dashboard') ? req.originalUrl : '/dashboard';
      return res.redirect('/login?redirect=' + encodeURIComponent(redirectUrl));
    }
    
    // Buscar dados do usuário
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      req.session.destroy();
      if (req.originalUrl.startsWith('/api')) {
        return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
      }
      return res.redirect('/login');
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    if (req.originalUrl.startsWith('/api')) {
      return res.status(500).json({ success: false, message: 'Erro de autenticação' });
    }
    res.redirect('/login');
  }
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    if (req.originalUrl.startsWith('/api')) {
      return res.status(403).json({ success: false, message: 'Acesso negado. Apenas administradores.' });
    }
    return res.status(403).send('Acesso negado. Apenas administradores podem acessar esta página.');
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};

