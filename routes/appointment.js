const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// IMPORTANTE: Rotas específicas devem vir ANTES das rotas genéricas

// Página de teste PIX (deve vir antes da rota genérica)
router.get('/test/pix', appointmentController.testPix);

// Submeter agendamento
router.post('/book', appointmentController.submitAppointment);

// Página de pagamento PIX
router.get('/:slug/payment/:id', appointmentController.showPayment);

// Agendamento concluído
router.get('/:slug/done/:id', appointmentController.appointmentDone);

// Rota principal do formulário de agendamento (deve vir por último)
router.get('/:slug/:appointment?', appointmentController.showForm);
router.post('/:slug/:appointment?', appointmentController.showForm);

module.exports = router;

