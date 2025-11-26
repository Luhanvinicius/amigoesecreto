const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Rotas da API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando' });
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

