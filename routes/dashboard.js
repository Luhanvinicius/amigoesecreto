const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const pool = require('../config/database');

// Dashboard do cliente
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar dados do usuário
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];
    
    // Buscar agendamentos do usuário
    const [appointments] = await pool.query(
      `SELECT a.*, s.name as service_name, s.price, l.name as location_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN locations l ON a.location_id = l.id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT 50`,
      [userId]
    );
    
    // Estatísticas
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM appointments
       WHERE user_id = ?`,
      [userId]
    );
    
    res.render('dashboard/client', {
      user: user,
      appointments: appointments,
      stats: stats[0] || { total: 0, paid: 0, confirmed: 0, pending: 0 },
      title: 'Meu Painel - Amigo e Secreto'
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).send('Erro ao carregar painel');
  }
});

// Perfil do cliente
router.get('/profile', requireAuth, async (req, res) => {
  let connection;
  try {
    console.log('🔍 Acessando perfil do usuário...');
    console.log('   URL original:', req.originalUrl);
    console.log('   URL completa:', req.url);
    console.log('   Base URL:', req.baseUrl);
    
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      console.error('❌ Usuário não encontrado na requisição');
      return res.status(401).redirect('/login?redirect=' + encodeURIComponent('/dashboard/profile'));
    }
    
    console.log('   User ID:', userId);
    
    connection = await pool.getConnection();
    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      console.error('❌ Usuário não encontrado no banco de dados');
      return res.status(404).send('Usuário não encontrado');
    }
    
    console.log('✅ Usuário encontrado:', users[0].email);
    console.log('✅ Renderizando perfil em /dashboard/profile');
    
    res.render('dashboard/profile', {
      user: users[0],
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null,
      title: 'Meu Perfil - Amigo e Secreto'
    });
  } catch (error) {
    console.error('❌ Erro ao carregar perfil:', error);
    console.error('   Stack:', error.stack);
    res.status(500).send('Erro ao carregar perfil: ' + error.message);
  } finally {
    if (connection) connection.release();
  }
});

// Atualizar perfil
router.post('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, contact, password } = req.body;
    
    let updateQuery = 'UPDATE users SET name = ?, contact = ?';
    let params = [name, contact];
    
    if (password && password.trim() !== '') {
      updateQuery += ', password = ?';
      params.push(password);
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(userId);
    
    await pool.query(updateQuery, params);
    
    // Atualizar sessão
    req.session.userName = name;
    
    res.redirect('/dashboard/profile?success=Perfil atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.redirect('/dashboard/profile?error=Erro ao atualizar perfil');
  }
});

module.exports = router;

