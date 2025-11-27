const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const pool = require('../config/database');

// Rotas da API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
});

// ========== CHAT API ==========

// Obter mensagens do chat (para cliente)
router.get('/chat/messages', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: false, message: 'Não autenticado' });
  }
  
  try {
    const userId = req.session.userId;
    
    // Buscar mensagens entre o usuário e admins/atendentes
    const [messages] = await pool.query(`
      SELECT cm.*, 
             sender.name as sender_name,
             receiver.name as receiver_name
      FROM chat_messages cm
      LEFT JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE cm.sender_id = ? OR cm.receiver_id = ?
      ORDER BY cm.created_at ASC
      LIMIT 100
    `, [userId, userId]);
    
    // Marcar mensagens como lidas
    await pool.query(
      'UPDATE chat_messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0',
      [userId]
    );
    
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar mensagens' });
  }
});

// Obter mensagens do chat (para admin - com usuário específico)
router.get('/chat/messages/:userId', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: false, message: 'Não autenticado' });
  }
  
  try {
    const adminId = req.session.userId;
    const clientId = req.params.userId;
    
    // Buscar dados do usuário
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [clientId]);
    if (users.length === 0) {
      return res.json({ success: false, message: 'Usuário não encontrado' });
    }
    
    // Buscar mensagens entre admin e cliente
    const [messages] = await pool.query(`
      SELECT cm.*, 
             sender.name as sender_name,
             receiver.name as receiver_name
      FROM chat_messages cm
      LEFT JOIN users sender ON cm.sender_id = sender.id
      LEFT JOIN users receiver ON cm.receiver_id = receiver.id
      WHERE (cm.sender_id = ? AND cm.receiver_id = ?)
         OR (cm.sender_id = ? AND cm.receiver_id = ?)
      ORDER BY cm.created_at ASC
      LIMIT 100
    `, [adminId, clientId, clientId, adminId]);
    
    // Marcar mensagens como lidas
    await pool.query(
      'UPDATE chat_messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [clientId, adminId]
    );
    
    res.json({ success: true, user: users[0], messages });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar mensagens' });
  }
});

// Enviar mensagem (cliente para admin)
router.post('/chat/send', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: false, message: 'Não autenticado' });
  }
  
  try {
    const senderId = req.session.userId;
    const { message, receiver_id } = req.body;
    
    if (!message || !message.trim()) {
      return res.json({ success: false, message: 'Mensagem vazia' });
    }
    
    // Se não especificar receiver, enviar para o primeiro admin
    let receiverId = receiver_id;
    if (!receiverId) {
      const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      if (admins.length === 0) {
        return res.json({ success: false, message: 'Nenhum admin disponível' });
      }
      receiverId = admins[0].id;
    }
    
    // Salvar mensagem
    await pool.query(
      'INSERT INTO chat_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [senderId, receiverId, message.trim()]
    );
    
    res.json({ success: true, message: 'Mensagem enviada' });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ success: false, message: 'Erro ao enviar mensagem' });
  }
});

// Contar mensagens não lidas
router.get('/chat/unread', async (req, res) => {
  if (!req.session.userId) {
    return res.json({ success: true, count: 0 });
  }
  
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM chat_messages WHERE receiver_id = ? AND is_read = 0',
      [req.session.userId]
    );
    
    res.json({ success: true, count: result[0].count || 0 });
  } catch (error) {
    res.json({ success: true, count: 0 });
  }
});

// API - Verificar status do pagamento (DEVE VIR ANTES de outras rotas /appointments)
router.get('/appointments/:id/payment-status', (req, res, next) => {
  console.log('✅ Rota payment-status chamada! ID:', req.params.id);
  next();
}, appointmentController.checkPaymentStatus);

// API - Duração do agendamento
router.post('/appointments/duration', appointmentController.getDuration);

// API - Dados do staff
router.get('/appointments/staff/data', appointmentController.getStaffData);

// API - Verificar usuário
router.post('/appointments/check-user', appointmentController.checkUser);

// API - Teste PIX
router.post('/test/pix', appointmentController.testPixApi);

module.exports = router;

