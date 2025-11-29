const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const pool = require('../config/database');

// Aplicar middleware de admin em todas as rotas
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard do admin
router.get('/dashboard', async (req, res) => {
  try {
    // Estatísticas gerais
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE payment_status = 'paid') as paid_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'confirmed') as confirmed_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'pending') as pending_appointments,
        (SELECT SUM(total_amount) FROM appointments WHERE payment_status = 'paid') as total_revenue
    `);
    
    // Agendamentos recentes
    const [recentAppointments] = await pool.query(`
      SELECT a.*, u.name as user_name, u.email as user_email, s.name as service_name, l.name as location_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    
    // Usuários recentes
    const [recentUsers] = await pool.query(`
      SELECT * FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    res.render('admin/dashboard', {
      stats: stats[0] || {},
      recentAppointments: recentAppointments,
      recentUsers: recentUsers,
      title: 'Painel Administrativo - Amigo e Secreto'
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard admin:', error);
    res.status(500).send('Erro ao carregar painel administrativo');
  }
});

// Gerenciar agendamentos
router.get('/appointments', async (req, res) => {
  try {
    const { status, payment_status, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (status) {
      whereClause += ' AND a.status = ?';
      params.push(status);
    }
    
    if (payment_status) {
      whereClause += ' AND a.payment_status = ?';
      params.push(payment_status);
    }
    
    const [appointments] = await pool.query(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.contact as user_contact,
             s.name as service_name, l.name as location_name,
             COALESCE(a.contact_status, 'pending') as contact_status
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    const [count] = await pool.query(`
      SELECT COUNT(*) as total FROM appointments a WHERE ${whereClause}
    `, params);
    
    res.render('admin/appointments', {
      appointments: appointments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count[0].total / limit),
      filters: { status, payment_status },
      title: 'Gerenciar Agendamentos - Admin'
    });
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
    res.status(500).send('Erro ao carregar agendamentos');
  }
});

// Atualizar status do agendamento
router.post('/appointments/:id/update-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status, contact_status } = req.body;
    
    let updates = [];
    let params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    
    if (payment_status) {
      updates.push('payment_status = ?');
      params.push(payment_status);
    }
    
    if (contact_status) {
      updates.push('contact_status = ?');
      params.push(contact_status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum campo para atualizar' });
    }
    
    const updateQuery = 'UPDATE appointments SET ' + updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    await pool.query(updateQuery, params);
    
    res.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
  }
});

// Atualizar status de contato do agendamento
router.post('/appointments/:id/update-contact-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { contact_status } = req.body;
    
    if (!contact_status || !['pending', 'confirmed'].includes(contact_status)) {
      return res.status(400).json({ success: false, message: 'Status de contato inválido' });
    }
    
    await pool.query(
      'UPDATE appointments SET contact_status = ? WHERE id = ?',
      [contact_status, id]
    );
    
    res.json({ success: true, message: 'Status de contato atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar status de contato:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar status de contato' });
  }
});

// Ver detalhes do agendamento
router.get('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [appointments] = await pool.query(`
      SELECT a.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.contact as user_contact,
             u.instagram as client_instagram,
             s.name as service_name, 
             l.name as location_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.id = ?
    `, [id]);
    
    if (appointments.length === 0) {
      return res.redirect('/admin/appointments?error=Agendamento não encontrado');
    }
    
    // Buscar atendentes
    const [attendants] = await pool.query(`
      SELECT a.*, u.name as user_name
      FROM attendants a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_active = 1
    `);
    
    res.render('admin/appointment-detail', {
      appointment: appointments[0],
      attendants,
      title: `Agendamento #${id}`
    });
  } catch (error) {
    console.error('Erro ao carregar agendamento:', error);
    res.redirect('/admin/appointments?error=Erro ao carregar agendamento');
  }
});

// Atualizar data/horário do agendamento
router.post('/appointments/:id/update-datetime', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;
    
    await pool.query(
      'UPDATE appointments SET appointment_date = ?, appointment_time = ? WHERE id = ?',
      [appointment_date, appointment_time, id]
    );
    
    res.json({ success: true, message: 'Data/Horário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar data/horário:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar data/horário' });
  }
});

// Atualizar atendente do agendamento
router.post('/appointments/:id/update-attendant', async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    
    await pool.query(
      'UPDATE appointments SET assigned_to = ? WHERE id = ?',
      [assigned_to || null, id]
    );
    
    res.json({ success: true, message: 'Atendente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar atendente:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar atendente' });
  }
});

// Atualizar observações do agendamento
router.post('/appointments/:id/update-observations', async (req, res) => {
  try {
    const { id } = req.params;
    const { observations } = req.body;
    
    await pool.query(
      'UPDATE appointments SET observations = ? WHERE id = ?',
      [observations || null, id]
    );
    
    res.json({ success: true, message: 'Observações salvas com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar observações:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar observações' });
  }
});

// Gerenciar usuários
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ?)';
      params.push('%' + search + '%', '%' + search + '%');
    }
    
    const [users] = await pool.query(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM appointments WHERE user_id = u.id) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE user_id = u.id AND payment_status = 'paid') as paid_appointments
      FROM users u
      WHERE ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    const [count] = await pool.query(`SELECT COUNT(*) as total FROM users WHERE ${whereClause}`, params);
    
    res.render('admin/users', {
      users: users,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count[0].total / limit),
      filters: { role, search },
      title: 'Gerenciar Usuários - Admin'
    });
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    res.status(500).send('Erro ao carregar usuários');
  }
});

// Criar novo usuário
router.post('/users/create', async (req, res) => {
  try {
    const { name, email, password, contact, gender, instagram, role, display_name, handles_calls, handles_messages, notes, user_type } = req.body;
    
    // Verificar se email já existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.redirect('/admin/users?error=Email já cadastrado');
    }
    
    // Determinar o role
    let userRole = role || 'client';
    if (user_type === 'client') userRole = 'client';
    
    // Criar usuário
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, contact, gender, instagram, type, role) 
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
      [name, email, password || null, contact || null, gender || null, instagram || null, userRole]
    );
    
    const userId = result.insertId;
    
    // Se for atendente, criar registro na tabela attendants
    if (userRole === 'attendant') {
      await pool.query(
        `INSERT INTO attendants (user_id, display_name, real_name, handles_calls, handles_messages) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, display_name || 'Lia', name, handles_calls ? 1 : 0, handles_messages ? 1 : 0]
      );
    }
    
    // Se tiver observação inicial, salvar
    if (notes && notes.trim()) {
      await pool.query(
        `INSERT INTO client_history (user_id, note_type, notes, created_by) VALUES (?, 'observation', ?, ?)`,
        [userId, notes, req.session.userId]
      );
    }
    
    res.redirect('/admin/users?success=Usuário criado com sucesso');
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.redirect('/admin/users?error=Erro ao criar usuário');
  }
});

// Ver detalhes do usuário (CRM)
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar usuário
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.redirect('/admin/users?error=Usuário não encontrado');
    }
    
    const user = users[0];
    
    // Buscar agendamentos do usuário
    const [appointments] = await pool.query(`
      SELECT a.*, s.name as service_name, l.name as location_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `, [id]);
    
    // Buscar histórico/observações
    const [clientHistory] = await pool.query(`
      SELECT ch.*, u.name as created_by_name
      FROM client_history ch
      LEFT JOIN users u ON ch.created_by = u.id
      WHERE ch.user_id = ?
      ORDER BY ch.created_at DESC
    `, [id]);
    
    // Buscar atendentes
    const [attendants] = await pool.query(`
      SELECT a.*, u.name as user_name
      FROM attendants a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_active = 1
    `);
    
    res.render('admin/user-detail', {
      user,
      appointments,
      clientHistory,
      attendants,
      title: `Cliente #${id} - ${user.name}`
    });
  } catch (error) {
    console.error('Erro ao carregar detalhes do usuário:', error);
    res.redirect('/admin/users?error=Erro ao carregar usuário');
  }
});

// Atualizar atendente do usuário
router.post('/users/:id/attendant', async (req, res) => {
  try {
    const { id } = req.params;
    const { attendant_id } = req.body;
    
    await pool.query(
      'UPDATE users SET assigned_attendant_id = ? WHERE id = ?',
      [attendant_id || null, id]
    );
    
    res.json({ success: true, message: 'Atendente atualizado' });
  } catch (error) {
    console.error('Erro ao atualizar atendente:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar' });
  }
});

// Editar usuário
router.get('/users/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.redirect('/admin/users?error=Usuário não encontrado');
    }
    
    res.render('admin/user-edit', {
      user: users[0],
      title: `Editar Usuário #${id}`
    });
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    res.redirect('/admin/users?error=Erro ao carregar usuário');
  }
});

// Atualizar usuário
router.post('/users/:id/update', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, contact, gender, instagram, password, role } = req.body;
    
    // Verificar se email já existe (exceto o próprio usuário)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.redirect(`/admin/users/${id}/edit?error=Email já cadastrado por outro usuário`);
    }
    
    // Atualizar usuário
    if (password && password.trim()) {
      await pool.query(
        `UPDATE users SET name = ?, email = ?, contact = ?, gender = ?, instagram = ?, password = ?, role = ? WHERE id = ?`,
        [name, email, contact || null, gender || null, instagram || null, password, role || 'client', id]
      );
    } else {
      await pool.query(
        `UPDATE users SET name = ?, email = ?, contact = ?, gender = ?, instagram = ?, role = ? WHERE id = ?`,
        [name, email, contact || null, gender || null, instagram || null, role || 'client', id]
      );
    }
    
    res.redirect(`/admin/users/${id}?success=Usuário atualizado com sucesso`);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.redirect(`/admin/users/${req.params.id}/edit?error=Erro ao atualizar usuário`);
  }
});

// Adicionar observação ao usuário
router.post('/users/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Observação vazia' });
    }
    
    await pool.query(
      `INSERT INTO client_history (user_id, note_type, notes, created_by) VALUES (?, 'observation', ?, ?)`,
      [id, notes.trim(), req.session.userId]
    );
    
    res.json({ success: true, message: 'Observação salva' });
  } catch (error) {
    console.error('Erro ao salvar observação:', error);
    res.status(500).json({ success: false, message: 'Erro ao salvar' });
  }
});

// Gerenciar serviços
router.get('/services', async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services ORDER BY id');
    res.render('admin/services', {
      services: services,
      req: req,
      title: 'Gerenciar Serviços - Admin'
    });
  } catch (error) {
    console.error('Erro ao carregar serviços:', error);
    res.status(500).send('Erro ao carregar serviços');
  }
});

// Criar/Editar serviço
router.post('/services', async (req, res) => {
  try {
    const { id, name, price, duration, description, requires_schedule, is_subscription } = req.body;
    
    // Converter checkbox para booleano/int
    const requiresSchedule = requires_schedule ? 1 : 0;
    const isSubscription = is_subscription ? 1 : 0;
    
    if (id) {
      // Atualizar
      await pool.query(
        'UPDATE services SET name = ?, price = ?, duration = ?, description = ?, requires_schedule = ?, is_subscription = ? WHERE id = ?',
        [name, price, duration || 0, description, requiresSchedule, isSubscription, id]
      );
    } else {
      // Criar
      await pool.query(
        'INSERT INTO services (name, price, duration, description, requires_schedule, is_subscription) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, duration || 0, description, requiresSchedule, isSubscription]
      );
    }
    
    res.redirect('/admin/services?success=Serviço salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar serviço:', error);
    res.redirect('/admin/services?error=Erro ao salvar serviço');
  }
});

// Deletar serviço
router.post('/services/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Serviço deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);
    res.status(500).json({ success: false, message: 'Erro ao deletar serviço' });
  }
});

// Agenda do admin
router.get('/agenda', async (req, res) => {
  try {
    const { month, year, day } = req.query;
    const currentDate = new Date();
    
    // Se tem parâmetro day, mostrar agenda do dia específico
    if (day) {
      const viewDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const [appointments] = await pool.query(`
        SELECT a.*, 
               u.name as user_name, 
               u.email as user_email, 
               u.contact as user_contact,
               s.name as service_name, 
               s.duration as service_duration,
               l.name as location_name
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN services s ON a.service_id = s.id
        LEFT JOIN locations l ON a.location_id = l.id
        WHERE a.appointment_date = ?
          AND a.status != 'cancelled'
          AND a.payment_status = 'paid'
        ORDER BY a.appointment_time ASC
      `, [viewDate]);
      
      return res.render('admin/agenda-day', {
        appointments: appointments,
        selectedDate: viewDate,
        selectedDay: parseInt(day),
        selectedMonth: parseInt(month),
        selectedYear: parseInt(year),
        title: `Agenda - ${day}/${month}/${year}`
      });
    }
    
    const viewMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const viewYear = year ? parseInt(year) : currentDate.getFullYear();
    
    // Buscar todos os agendamentos confirmados e pagos do mês
    const startDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`;
    const endDate = new Date(viewYear, viewMonth, 0).toISOString().split('T')[0];
    
    const [appointments] = await pool.query(`
      SELECT a.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.contact as user_contact,
             s.name as service_name, 
             s.duration as service_duration,
             l.name as location_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.appointment_date >= ? 
        AND a.appointment_date <= ?
        AND a.status != 'cancelled'
        AND a.payment_status = 'paid'
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `, [startDate, endDate]);
    
    // Organizar agendamentos por data
    const appointmentsByDate = {};
    appointments.forEach(apt => {
      const dateKey = apt.appointment_date.toISOString().split('T')[0];
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      appointmentsByDate[dateKey].push(apt);
    });
    
    res.render('admin/agenda', {
      appointments: appointmentsByDate,
      currentMonth: viewMonth,
      currentYear: viewYear,
      title: 'Agenda - Admin'
    });
  } catch (error) {
    console.error('Erro ao carregar agenda:', error);
    res.status(500).send('Erro ao carregar agenda');
  }
});

// WhatsApp Web - Emulação
router.get('/whatsapp', async (req, res) => {
  try {
    // Verificar se está no Vercel (WhatsApp não funciona em serverless)
    if (process.env.VERCEL || process.env.ENABLE_WHATSAPP === 'false') {
      return res.render('admin/whatsapp-disabled', {
        title: 'WhatsApp Web - Não Disponível',
        message: 'WhatsApp não está disponível neste ambiente (Vercel serverless não suporta Puppeteer).'
      });
    }
    
    res.render('admin/whatsapp', {
      title: 'WhatsApp Web - Admin'
    });
  } catch (error) {
    console.error('Erro ao carregar WhatsApp:', error);
    res.status(500).send('Erro ao carregar WhatsApp');
  }
});

// API: Obter status do WhatsApp
router.get('/whatsapp/status', async (req, res) => {
  try {
    // Verificar se está no Vercel
    if (process.env.VERCEL || process.env.ENABLE_WHATSAPP === 'false') {
      return res.json({
        status: 'unavailable',
        message: 'WhatsApp não está disponível no Vercel (não suporta Puppeteer)'
      });
    }
    
    const whatsappService = require('../services/whatsappService');
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Erro ao obter status WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao obter status' });
  }
});

// API: Obter QR Code
router.get('/whatsapp/qrcode', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const qrCode = whatsappService.getQRCode();
    
    if (qrCode) {
      res.json({ qrCode: qrCode });
    } else {
      res.json({ qrCode: null });
    }
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    res.status(500).json({ error: 'Erro ao obter QR Code' });
  }
});

// API: Inicializar WhatsApp
router.post('/whatsapp/initialize', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    whatsappService.initialize();
    res.json({ success: true, message: 'WhatsApp inicializando...' });
  } catch (error) {
    console.error('Erro ao inicializar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao inicializar WhatsApp' });
  }
});

// API: Reiniciar WhatsApp
router.post('/whatsapp/restart', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    await whatsappService.restart();
    res.json({ success: true, message: 'WhatsApp reiniciando...' });
  } catch (error) {
    console.error('Erro ao reiniciar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao reiniciar WhatsApp' });
  }
});

// API: Obter chats
router.get('/whatsapp/chats', async (req, res) => {
  try {
    const whatsappService = require('../services/whatsappService');
    const chats = await whatsappService.getChats();
    res.json({ success: true, chats });
  } catch (error) {
    console.error('Erro ao obter chats:', error);
    res.status(500).json({ error: error.message || 'Erro ao obter chats' });
  }
});

// API: Obter mensagens de um chat
router.get('/whatsapp/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const whatsappService = require('../services/whatsappService');
    
    // Verificar se WhatsApp está pronto
    const status = whatsappService.getStatus();
    if (status.status !== 'ready' && status.status !== 'authenticated') {
      return res.json({ 
        success: true, 
        messages: [] // Retornar array vazio em vez de erro
      });
    }
    
    try {
      const messages = await whatsappService.getMessages(decodeURIComponent(chatId), limit);
      res.json({ success: true, messages });
    } catch (msgError) {
      // Se for erro de LID ou Target closed, retornar array vazio
      if (msgError.message && (
        msgError.message.includes('LID') || 
        msgError.message.includes('No LID') ||
        msgError.message.includes('Target closed') ||
        msgError.message.includes('Protocol error')
      )) {
        console.log('⚠️ Erro ao obter mensagens (retornando vazio):', msgError.message);
        return res.json({ success: true, messages: [] });
      }
      throw msgError;
    }
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    // Sempre retornar sucesso com array vazio para não quebrar a interface
    res.json({ success: true, messages: [] });
  }
});

// Configurar multer para upload de arquivos
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretório de uploads se não existir
// No Vercel, usar /tmp (único diretório writable)
let uploadsDir;
if (process.env.VERCEL) {
  uploadsDir = '/tmp/uploads/whatsapp';
} else {
  uploadsDir = path.join(__dirname, '../uploads/whatsapp');
}

// Criar diretório apenas se não for Vercel ou se /tmp existir
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (error) {
  console.warn('⚠️ Não foi possível criar diretório de uploads:', error.message);
  // Fallback para /tmp se no Vercel
  if (process.env.VERCEL) {
    uploadsDir = '/tmp';
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// API: Enviar mensagem
router.post('/whatsapp/send', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { number, message, caption } = req.body;
    
    if (!number) {
      return res.status(400).json({ error: 'Número é obrigatório' });
    }

    const whatsappService = require('../services/whatsappService');
    let result;
    
    // Verificar se há áudio para enviar (prioridade para áudio)
    if (req.files && req.files.audio && req.files.audio[0]) {
      const audioPath = req.files.audio[0].path;
      result = await whatsappService.sendAudio(number, audioPath);
      
      // Limpar arquivo após enviar
      setTimeout(() => {
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
        }
      }, 5000);
    }
    // Verificar se há arquivo de áudio (vindo como file mas com mimetype audio)
    else if (req.files && req.files.file && req.files.file[0]) {
      const file = req.files.file[0];
      const filePath = file.path;
      
      // Verificar se é áudio pelo mimetype ou extensão
      const isAudio = (file.mimetype && file.mimetype.includes('audio')) || 
                      (file.originalname && /\.(ogg|oga|opus|wav|mp3|m4a)$/i.test(file.originalname));
      
      if (isAudio) {
        result = await whatsappService.sendAudio(number, filePath);
      } else {
        const fileCaption = caption || message || '';
        result = await whatsappService.sendFile(number, filePath, fileCaption);
      }
      
      // Limpar arquivo após enviar
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 5000);
    }
    // Enviar mensagem de texto
    else if (message) {
      result = await whatsappService.sendMessage(number, message);
    } else {
      return res.status(400).json({ error: 'Mensagem ou arquivo é obrigatório' });
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    
    // Limpar arquivos em caso de erro
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }
    
    res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
  }
});

// Tela de Atendimentos Pendentes
router.get('/whatsapp/pending', async (req, res) => {
  try {
    const [appointments] = await pool.query(`
      SELECT a.*, 
             u.name as user_name, 
             u.email as user_email, 
             u.contact as user_contact,
             s.name as service_name, 
             s.duration as service_duration,
             l.name as location_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE COALESCE(a.contact_status, 'pending') = 'pending'
        AND a.status != 'cancelled'
        AND a.payment_status = 'paid'
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `);
    
    res.render('admin/whatsapp-pending', {
      appointments: appointments,
      title: 'Atendimentos Pendentes - WhatsApp'
    });
  } catch (error) {
    console.error('Erro ao carregar atendimentos pendentes:', error);
    res.status(500).send('Erro ao carregar atendimentos pendentes');
  }
});

// API: Iniciar atendimento (atualizar status e abrir chat)
router.post('/whatsapp/pending/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Atualizar status para confirmado
    await pool.query(
      'UPDATE appointments SET contact_status = ? WHERE id = ?',
      ['confirmed', id]
    );
    
    // Buscar dados do agendamento
    const [appointments] = await pool.query(`
      SELECT a.*, 
             u.name as user_name, 
             u.contact as user_contact
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `, [id]);
    
    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const appointment = appointments[0];
    
    // Formatar número do WhatsApp
    let whatsappNumber = null;
    if (appointment.user_contact) {
      const cleaned = String(appointment.user_contact).replace(/\D/g, '');
      if (cleaned.length > 0) {
        const cleanedNoZero = cleaned.replace(/^0+/, '');
        if (cleanedNoZero.indexOf('55') === 0) {
          whatsappNumber = cleanedNoZero;
        } else if (cleanedNoZero.length >= 10 && cleanedNoZero.length <= 11) {
          whatsappNumber = '55' + cleanedNoZero;
        } else if (cleanedNoZero.length >= 12) {
          whatsappNumber = cleanedNoZero;
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Atendimento iniciado com sucesso',
      whatsappNumber: whatsappNumber,
      chatId: whatsappNumber ? `${whatsappNumber}@c.us` : null,
      userName: appointment.user_name
    });
  } catch (error) {
    console.error('Erro ao iniciar atendimento:', error);
    res.status(500).json({ error: error.message || 'Erro ao iniciar atendimento' });
  }
});

// API: Resumo do cliente (para agenda)
router.get('/api/client/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.json({ success: false, message: 'Cliente não encontrado' });
    }
    
    const [appointments] = await pool.query(`
      SELECT a.*, s.name as service_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [id]);
    
    const [notes] = await pool.query(`
      SELECT * FROM client_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `, [id]);
    
    res.json({
      success: true,
      client: users[0],
      appointments,
      notes
    });
  } catch (error) {
    console.error('Erro ao carregar resumo do cliente:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar dados' });
  }
});

// Criar agendamento manual - Formulário
router.get('/agenda/new', async (req, res) => {
  try {
    const { date } = req.query;
    
    const [services] = await pool.query('SELECT * FROM services WHERE is_active = 1 OR is_active IS NULL ORDER BY name');
    const [locations] = await pool.query('SELECT * FROM locations ORDER BY name');
    const [users] = await pool.query('SELECT id, name, email, contact FROM users WHERE role = "client" OR role IS NULL ORDER BY name');
    const [attendants] = await pool.query(`
      SELECT a.*, u.name as user_name
      FROM attendants a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.is_active = 1
    `);
    
    res.render('admin/agenda-new', {
      services,
      locations,
      users,
      attendants,
      selectedDate: date || new Date().toISOString().split('T')[0],
      title: 'Novo Agendamento Manual'
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.redirect('/admin/agenda?error=Erro ao carregar formulário');
  }
});

// Criar agendamento manual - Processar
router.post('/agenda/new', async (req, res) => {
  try {
    const {
      user_id, new_user_name, new_user_email, new_user_contact,
      service_id, location_id, appointment_date, appointment_time,
      payment_status, status, assigned_to, observations,
      client_expectation, conversation_topic
    } = req.body;
    
    let finalUserId = user_id;
    
    // Se não selecionou usuário existente, criar novo
    if (!user_id || user_id === 'new') {
      if (!new_user_email) {
        return res.redirect('/admin/agenda/new?error=E-mail é obrigatório');
      }
      
      // Verificar se email já existe
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [new_user_email]);
      
      if (existing.length > 0) {
        finalUserId = existing[0].id;
      } else {
        // Criar novo usuário
        const [result] = await pool.query(
          `INSERT INTO users (name, email, contact, type, role) VALUES (?, ?, ?, 'new', 'client')`,
          [new_user_name || 'Cliente', new_user_email, new_user_contact || null]
        );
        finalUserId = result.insertId;
      }
    }
    
    // Buscar preço do serviço
    const [services] = await pool.query('SELECT price FROM services WHERE id = ?', [service_id]);
    const price = services.length > 0 ? services[0].price : 0;
    
    // Criar agendamento
    const [result] = await pool.query(
      `INSERT INTO appointments 
       (user_id, service_id, location_id, appointment_date, appointment_time, 
        total_amount, payment_status, status, assigned_to, observations,
        client_expectation, conversation_topic, contact_status, business_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 1)`,
      [
        finalUserId, service_id, location_id, appointment_date, appointment_time,
        price, payment_status || 'pending', status || 'confirmed',
        assigned_to || null, observations || null,
        client_expectation || null, conversation_topic || null
      ]
    );
    
    res.redirect(`/admin/appointments/${result.insertId}?success=Agendamento criado com sucesso`);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.redirect('/admin/agenda/new?error=Erro ao criar agendamento');
  }
});

// Sistema de Notificações
router.get('/notifications', async (req, res) => {
  try {
    // Buscar agendamentos recentes (últimas 24h)
    const [recentAppointments] = await pool.query(`
      SELECT a.*, u.name as user_name, s.name as service_name
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN services s ON a.service_id = s.id
      WHERE a.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    
    // Buscar mensagens não lidas do chat
    const [unreadMessages] = await pool.query(`
      SELECT cm.*, u.name as sender_name
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.is_read = 0
      ORDER BY cm.created_at DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      notifications: {
        appointments: recentAppointments,
        messages: unreadMessages,
        appointmentsCount: recentAppointments.length,
        messagesCount: unreadMessages.length
      }
    });
  } catch (error) {
    console.error('Erro ao carregar notificações:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar notificações' });
  }
});

// Página de Configurações/FAQ
router.get('/settings', async (req, res) => {
  try {
    res.render('admin/settings', {
      title: 'Configurações e FAQ'
    });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    res.status(500).send('Erro ao carregar configurações');
  }
});

// Executar migração das configurações do site (via browser)
router.get('/setup-site-settings', async (req, res) => {
  try {
    // Criar tabela de configurações
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type ENUM('text', 'textarea', 'image', 'color', 'number') DEFAULT 'text',
        setting_group VARCHAR(50) DEFAULT 'general',
        setting_label VARCHAR(200),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Inserir configurações padrão
    const defaultSettings = [
      ['site_name', 'Amigo e Secreto', 'text', 'header', 'Nome do Site'],
      ['site_logo', '/images/logo-amigo-secreto.png', 'image', 'header', 'Logo do Site'],
      ['header_phone', '+55 11 99999-9999', 'text', 'header', 'Telefone no Header'],
      ['hero_title', 'Precisa de Alguém Para Conversar? Eu Estou Aqui Para Ouvir.', 'text', 'hero', 'Título Principal'],
      ['hero_subtitle', 'Se você tem algo no coração, um segredo ou só precisa de um amigo secreto para conversar, eu estou à disposição.', 'textarea', 'hero', 'Subtítulo'],
      ['hero_button_text', 'Vamos Conversar?', 'text', 'hero', 'Texto do Botão'],
      ['hero_image', '/images/uploads/Lucid_Origin_Create_an_image_of_Lia_a_young_woman_with_mediuml_0-2-1080x1080.jpg', 'image', 'hero', 'Imagem Principal'],
      ['about_title', 'Eu sou a Lia', 'text', 'about', 'Título da Seção Sobre'],
      ['about_text', 'Em um mundo que muitas vezes parece apressado e impessoal, o Amigo e Secreto é um espaço onde você pode se expressar livremente.', 'textarea', 'about', 'Texto Sobre'],
      ['about_image', '/images/uploads/about-1024x709.jpg', 'image', 'about', 'Imagem da Seção Sobre'],
      ['services_title', 'Escolha o plano ideal para você', 'text', 'services', 'Título da Seção Serviços'],
      ['services_subtitle', 'Opções simples, valores justos, apoio de verdade.', 'textarea', 'services', 'Subtítulo Serviços'],
      ['contact_title', 'Entre em Contato', 'text', 'contact', 'Título Contato'],
      ['contact_email', 'contato@amigoesecreto.com', 'text', 'contact', 'E-mail de Contato'],
      ['contact_phone', '+55 11 99999-9999', 'text', 'contact', 'Telefone de Contato'],
      ['contact_instagram', '@amigoesecreto', 'text', 'contact', 'Instagram'],
      ['contact_whatsapp', '5511999999999', 'text', 'contact', 'WhatsApp (apenas números)'],
      ['footer_text', '© 2024 Amigo e Secreto. Todos os direitos reservados.', 'textarea', 'footer', 'Texto do Rodapé'],
      ['primary_color', '#667eea', 'color', 'colors', 'Cor Primária'],
      ['secondary_color', '#764ba2', 'color', 'colors', 'Cor Secundária'],
      ['work_start_hour', '8', 'number', 'schedule', 'Hora de Início (ex: 8)'],
      ['work_end_hour', '20', 'number', 'schedule', 'Hora de Fim (ex: 20)'],
      ['slot_duration', '30', 'number', 'schedule', 'Duração do Slot (minutos)'],
    ];

    for (const [key, value, type, group, label] of defaultSettings) {
      await pool.query(`
        INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, setting_group, setting_label)
        VALUES (?, ?, ?, ?, ?)
      `, [key, value, type, group, label]);
    }

    // Invalidar cache
    const { invalidateCache } = require('../middleware/siteSettings');
    invalidateCache();

    res.redirect('/admin/site-editor?success=Tabela de configurações criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    res.redirect('/admin/site-editor?error=Erro ao criar tabela: ' + error.message);
  }
});

// Editor do Site
router.get('/site-editor', async (req, res) => {
  try {
    // Buscar configurações do banco
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    
    // Converter para objeto
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    res.render('admin/site-editor', {
      settings,
      success: req.query.success,
      error: req.query.error,
      title: 'Editor do Site'
    });
  } catch (error) {
    console.error('Erro ao carregar editor:', error);
    // Se a tabela não existir, mostrar com configurações vazias
    res.render('admin/site-editor', {
      settings: {},
      error: 'Execute a migração para criar a tabela de configurações: node scripts/migrate-site-settings.js',
      title: 'Editor do Site'
    });
  }
});

// Salvar configurações do site
router.post('/site-editor/save', async (req, res) => {
  try {
    const settingsToSave = [
      'site_name', 'site_logo', 'header_phone',
      'hero_title', 'hero_subtitle', 'hero_button_text', 'hero_image',
      'about_title', 'about_text', 'about_image',
      'services_title', 'services_subtitle',
      'contact_title', 'contact_email', 'contact_phone', 'contact_instagram', 'contact_whatsapp',
      'footer_text',
      'primary_color', 'secondary_color',
      'work_start_hour', 'work_end_hour', 'slot_duration'
    ];
    
    for (const key of settingsToSave) {
      const value = req.body[key] || '';
      await pool.query(
        `INSERT INTO site_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, value, value]
      );
    }
    
    // Invalidar cache para que as alterações apareçam imediatamente
    const { invalidateCache } = require('../middleware/siteSettings');
    invalidateCache();
    
    res.redirect('/admin/site-editor?success=Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.redirect('/admin/site-editor?error=Erro ao salvar configurações');
  }
});

// API para obter configurações do site (para uso no frontend)
router.get('/api/site-settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    res.status(500).json({ success: false, message: 'Erro ao carregar configurações' });
  }
});

// Chat interno
router.get('/chat', async (req, res) => {
  try {
    // Buscar todas as conversas (usuários que já trocaram mensagens)
    const [conversations] = await pool.query(`
      SELECT DISTINCT
        u.id as user_id,
        u.name as user_name,
        u.email,
        (SELECT message FROM chat_messages cm2 
         WHERE (cm2.sender_id = u.id OR cm2.receiver_id = u.id) 
         ORDER BY cm2.created_at DESC LIMIT 1) as last_message,
        (SELECT DATE_FORMAT(created_at, '%H:%i') FROM chat_messages cm3 
         WHERE (cm3.sender_id = u.id OR cm3.receiver_id = u.id) 
         ORDER BY cm3.created_at DESC LIMIT 1) as last_time,
        (SELECT COUNT(*) FROM chat_messages cm4 
         WHERE cm4.sender_id = u.id AND cm4.is_read = 0) as unread
      FROM users u
      WHERE u.role = 'client' OR u.role IS NULL
      AND EXISTS (
        SELECT 1 FROM chat_messages cm 
        WHERE cm.sender_id = u.id OR cm.receiver_id = u.id
      )
      ORDER BY (SELECT MAX(created_at) FROM chat_messages cm5 
                WHERE cm5.sender_id = u.id OR cm5.receiver_id = u.id) DESC
    `);
    
    // Se não houver conversas, buscar todos os clientes
    let finalConversations = conversations;
    if (conversations.length === 0) {
      const [clients] = await pool.query(`
        SELECT id as user_id, name as user_name, email, NULL as last_message, NULL as last_time, 0 as unread
        FROM users 
        WHERE role = 'client' OR role IS NULL
        ORDER BY created_at DESC
        LIMIT 20
      `);
      finalConversations = clients;
    }
    
    res.render('admin/chat', {
      conversations: finalConversations,
      userId: req.session.userId,
      title: 'Chat - Admin'
    });
  } catch (error) {
    console.error('Erro ao carregar chat:', error);
    res.status(500).send('Erro ao carregar chat');
  }
});

module.exports = router;

