const path = require('path');
const pool = require('../config/database');
const asaas = require('../config/asaas');

// Dados mockados do business
const mockBusiness = {
  id: 1,
  name: 'Amigo e Secreto',
  slug: 'amigo-secreto',
  layouts: 'Formlayout1',
  theme_color: 'v1',
  enable_pwa: 'off',
  created_by: 1
};

const appointmentController = {
  // Mostrar formulário de agendamento
  showForm: async (req, res) => {
    try {
      const { slug, appointment } = req.params;
      const { service } = req.query;
      
      const business = mockBusiness;
      
      // Buscar serviços do banco
      const [services] = await pool.query('SELECT * FROM services ORDER BY id');
      
      // Buscar localizações do banco
      const [locations] = await pool.query('SELECT * FROM locations ORDER BY id');
      
      const staffs = [];
      
      const companySettings = {
        additional_services: 2,
        appointment_review_is_on: 'off'
      };
      
      const customFields = [];
      const files = { value: 'off' };
      const customField = 'off';
      
      const bookingModes = ['1', '2'];
      
      res.render('form_layout/Formlayout1/index', {
        business,
        services,
        locations,
        staffs,
        companySettings,
        customFields,
        files,
        customField,
        bookingModes,
        slug: slug || 'amigo-secreto',
        appointment,
        selectedService: service || null,
        csrfToken: 'mock-csrf-token',
        currencySetting: JSON.stringify({
          site_currency_symbol_position: 'pre',
          currency_format: 'symbol',
          currency_space: 'with',
          site_currency_symbol_name: 'R$',
          defult_currancy_symbol: 'R$',
          defult_currancy: 'BRL',
          float_number: 2,
          decimal_separator: ',',
          thousand_separator: '.'
        })
      });
    } catch (error) {
      console.error('Erro ao mostrar formulário:', error);
      res.status(500).send('Erro ao carregar formulário');
    }
  },

  // Submeter agendamento
  submitAppointment: async (req, res) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // IMPORTANTE: Os dados podem vir como arrays devido aos múltiplos tabs do formulário
      // Precisamos normalizar para pegar apenas o primeiro valor não vazio
      const normalizeField = (field) => {
        if (Array.isArray(field)) {
          // Encontrar o primeiro valor não vazio no array
          const validValue = field.find(val => val && String(val).trim() !== '');
          return validValue || null;
        }
        return field || null;
      };
      
      const rawData = req.body;
      const name = normalizeField(rawData.name);
      const email = normalizeField(rawData.email);
      const password = normalizeField(rawData.password);
      const contact = normalizeField(rawData.contact);
      const type = normalizeField(rawData.type);
      const service = normalizeField(rawData.service);
      const location = normalizeField(rawData.location);
      const appointment_date = normalizeField(rawData.appointment_date);
      const appointment_time = normalizeField(rawData.appointment_time);
      const payment_method = normalizeField(rawData.payment_method);
      const business_id = normalizeField(rawData.business_id);
      
      // Log dos dados recebidos para debug
      console.log('=== DADOS RECEBIDOS NO SUBMIT ===');
      console.log('Dados brutos (exemplo):', {
        name: rawData.name,
        email: rawData.email,
        contact: rawData.contact
      });
      console.log('Dados normalizados:', {
        type: type,
        name: name,
        email: email,
        hasPassword: !!password,
        contact: contact,
        service: service,
        appointment_date: appointment_date,
        appointment_time: appointment_time
      });
      console.log('================================');
      
      // Converter data de dd-mm-yyyy para yyyy-mm-dd
      let formattedDate;
      if (appointment_date.includes('-')) {
        const [day, month, year] = appointment_date.split('-');
        formattedDate = `${year}-${month}-${day}`;
      } else {
        // Se já está no formato correto ou outro formato
        formattedDate = appointment_date;
      }
      
      // Validar se a data está no formato correto
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
        throw new Error('Formato de data inválido. Esperado: dd-mm-yyyy');
      }
      
      // Buscar preço do serviço
      const [services] = await connection.query(
        'SELECT price FROM services WHERE id = ?',
        [service]
      );
      
      if (services.length === 0) {
        throw new Error('Serviço não encontrado');
      }
      
      const totalAmount = parseFloat(services[0].price);
      
      // Criar ou buscar usuário
      let userId = null;
      console.log('=== CRIAÇÃO/BUSCA DE USUÁRIO ===');
      console.log('Tipo recebido:', type);
      console.log('Dados normalizados (valores finais):', { 
        name: name, 
        email: email, 
        contact: contact, 
        hasPassword: !!password,
        nameType: typeof name,
        emailType: typeof email
      });
      
      // Garantir que os valores são strings (não arrays)
      const sanitizeValue = (val) => {
        if (Array.isArray(val)) {
          return val.find(v => v && String(v).trim() !== '') || null;
        }
        return val ? String(val).trim() : null;
      };
      
      const finalName = sanitizeValue(name);
      const finalEmail = sanitizeValue(email);
      const finalPassword = sanitizeValue(password);
      const finalContact = sanitizeValue(contact);
      
      console.log('Valores sanitizados:', {
        name: finalName,
        email: finalEmail,
        hasPassword: !!finalPassword,
        contact: finalContact
      });
      
      // Normalizar o tipo (pode vir como 'new-user', 'existing-user', 'guest-user')
      let normalizedType = type ? String(type).replace('-user', '') : type;
      console.log('Tipo recebido:', type);
      console.log('Tipo normalizado (inicial):', normalizedType);
      
      // DETECÇÃO AUTOMÁTICA: Se o tipo não está correto, tentar inferir baseado nos dados
      // Se tem email e senha mas NÃO tem nome, provavelmente é "existing-user"
      if (finalEmail && finalPassword && (!finalName || finalName.trim() === '') && (!type || type === 'new-user')) {
        console.log('🔍 Detectando tipo automaticamente: parece ser "existing-user" (tem email+senha mas sem nome)');
        normalizedType = 'existing';
        type = 'existing-user';
      }
      
      // IMPORTANTE: Para "new-user", nome é obrigatório
      if ((normalizedType === 'new' || type === 'new-user') && finalEmail && finalName && finalName.trim() !== '') {
        // Criar novo usuário
        console.log('📝 Criando novo usuário...');
        try {
          const [userResult] = await connection.query(
            'INSERT INTO users (name, email, password, contact, type, role) VALUES (?, ?, ?, ?, ?, ?)',
            [finalName, finalEmail, finalPassword || null, finalContact || null, 'new', 'client']
          );
          userId = userResult.insertId;
          console.log('✅ Novo usuário criado com ID:', userId);
        } catch (userError) {
          // Se o email já existe, tentar buscar o usuário existente
          if (userError.code === 'ER_DUP_ENTRY') {
            console.log('⚠️ Email já existe, buscando usuário existente...');
            const [existingUsers] = await connection.query(
              'SELECT id FROM users WHERE email = ?',
              [finalEmail]
            );
            if (existingUsers.length > 0) {
              userId = existingUsers[0].id;
              console.log('✅ Usuário existente encontrado com ID:', userId);
            } else {
              throw new Error('Email já cadastrado mas usuário não encontrado.');
            }
          } else {
            throw userError;
          }
        }
      } else if ((normalizedType === 'existing' || type === 'existing-user') && finalEmail && finalPassword) {
        // Buscar usuário existente
        console.log('🔍 Buscando usuário existente...');
        console.log('   Email:', finalEmail);
        console.log('   Senha fornecida:', finalPassword ? 'Sim (' + finalPassword.length + ' caracteres)' : 'Não');
        
        const [users] = await connection.query(
          'SELECT id FROM users WHERE email = ? AND password = ?',
          [finalEmail, finalPassword]
        );
        
        console.log('   Usuários encontrados:', users.length);
        
        if (users.length > 0) {
          userId = users[0].id;
          console.log('✅ Usuário existente encontrado com ID:', userId);
        } else {
          // Tentar buscar apenas por email para ver se existe
          const [usersByEmail] = await connection.query(
            'SELECT id, email FROM users WHERE email = ?',
            [finalEmail]
          );
          
          if (usersByEmail.length > 0) {
            console.log('⚠️ Email encontrado mas senha incorreta');
            throw new Error('Senha incorreta. Por favor, verifique sua senha.');
          } else {
            console.log('⚠️ Email não encontrado no banco');
            throw new Error('Usuário não encontrado. Verifique seu email ou crie uma nova conta.');
          }
        }
      } else if ((normalizedType === 'guest' || type === 'guest-user') && finalName && finalEmail) {
        // Criar usuário convidado
        console.log('👤 Criando usuário convidado...');
        try {
          const [userResult] = await connection.query(
            'INSERT INTO users (name, email, contact, type, role) VALUES (?, ?, ?, ?, ?)',
            [finalName, finalEmail, finalContact || null, 'guest', 'client']
          );
          userId = userResult.insertId;
          console.log('✅ Usuário convidado criado com ID:', userId);
        } catch (userError) {
          // Se o email já existe, tentar buscar o usuário existente
          if (userError.code === 'ER_DUP_ENTRY') {
            console.log('⚠️ Email já existe, buscando usuário existente...');
            const [existingUsers] = await connection.query(
              'SELECT id FROM users WHERE email = ?',
              [finalEmail]
            );
            if (existingUsers.length > 0) {
              userId = existingUsers[0].id;
              console.log('✅ Usuário existente encontrado com ID:', userId);
            } else {
              throw new Error('Email já cadastrado mas usuário não encontrado.');
            }
          } else {
            throw userError;
          }
        }
      } else {
        console.warn('⚠️ Tipo de usuário não reconhecido ou dados incompletos:', { 
          type, 
          normalizedType, 
          hasName: !!finalName, 
          hasEmail: !!finalEmail,
          hasPassword: !!finalPassword,
          dadosRecebidos: { name, email, password, contact }
        });
        
        // Tentar inferir o tipo baseado nos dados recebidos
        if (finalEmail && finalPassword && !finalName) {
          // Tem email e senha mas não tem nome - provavelmente é "existing-user"
          console.log('🔍 Tentando inferir tipo: parece ser usuário existente (tem email+senha mas sem nome)');
          normalizedType = 'existing';
          type = 'existing-user';
          
          // Tentar buscar usuário existente novamente
          const [users] = await connection.query(
            'SELECT id FROM users WHERE email = ? AND password = ?',
            [finalEmail, finalPassword]
          );
          
          if (users.length > 0) {
            userId = users[0].id;
            console.log('✅ Usuário existente encontrado com ID:', userId);
          } else {
            throw new Error('Usuário não encontrado ou senha incorreta. Verifique suas credenciais.');
          }
        } else {
          throw new Error('Tipo de usuário não reconhecido ou dados incompletos. Tipo recebido: ' + type);
        }
      }
      
      if (!userId) {
        console.error('❌ ERRO: userId é null após tentar criar/buscar usuário!');
        console.error('   Dados disponíveis:', { type, normalizedType, finalEmail, hasPassword: !!finalPassword, hasName: !!finalName });
        throw new Error('Não foi possível criar ou encontrar o usuário. Por favor, verifique os dados fornecidos e o tipo de cadastro selecionado.');
      }
      
      console.log('✅ userId final:', userId);
      console.log('================================');
      
      // Criar agendamento
      console.log('📅 Criando agendamento...');
      console.log('   user_id:', userId);
      console.log('   service_id:', service);
      console.log('   location_id:', location || null);
      console.log('   appointment_date:', formattedDate);
      console.log('   appointment_time:', appointment_time);
      console.log('   total_amount:', totalAmount);
      
      const [appointmentResult] = await connection.query(
        `INSERT INTO appointments 
         (user_id, service_id, location_id, appointment_date, appointment_time, total_amount, status, payment_status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
        [userId, service, location || null, formattedDate, appointment_time, totalAmount]
      );
      
      const appointmentId = appointmentResult.insertId;
      console.log('✅ Agendamento criado com sucesso!');
      console.log('   Appointment ID:', appointmentId);
      console.log('   User ID vinculado:', userId);
      console.log('   ================================');
      
      // Verificar se o agendamento foi criado corretamente com user_id
      const [verifyAppointment] = await connection.query(
        'SELECT user_id FROM appointments WHERE id = ?',
        [appointmentId]
      );
      if (verifyAppointment.length > 0) {
        console.log('✅ Verificação: Agendamento #' + appointmentId + ' está vinculado ao user_id:', verifyAppointment[0].user_id);
      }
      
      // Criar pagamento no Asaas
      let asaasPaymentId = null;
      let paymentUrl = null;
      // IMPORTANTE: Declarar as variáveis PIX fora do bloco try para que estejam acessíveis depois
      let pixQrCode = null;
      let pixCopiaECola = null;
      
      try {
        // Buscar ou criar cliente no Asaas usando os dados do usuário
        console.log('🔑 Buscando/criando cliente no Asaas...');
        console.log('   Nome:', finalName);
        console.log('   Email:', finalEmail);
        console.log('   Telefone:', finalContact);
        
        // Preparar dados do cliente para o Asaas
        const customerData = {
          name: finalName,
          email: finalEmail,
          phone: finalContact || null
        };
        
        // Buscar ou criar cliente no Asaas
        const asaasCustomer = await asaas.getOrCreateCustomer(customerData);
        
        if (!asaasCustomer || !asaasCustomer.id) {
          throw new Error('Não foi possível criar ou encontrar o cliente no Asaas');
        }
        
        console.log('✅ Cliente no Asaas:');
        console.log('   ID:', asaasCustomer.id);
        console.log('   Nome:', asaasCustomer.name);
        console.log('   Email:', asaasCustomer.email);
        console.log('   CPF:', asaasCustomer.cpfCnpj || 'Não informado');

        const customerId = asaasCustomer.id;

        if (!customerId) {
          console.error('❌ Cliente sem ID válido. Resposta completa:', JSON.stringify(asaasCustomer, null, 2));
          throw new Error('Cliente sem ID válido no Asaas');
        }

        console.log('✅ Cliente ID usado no pagamento:', customerId);
        
        // Criar pagamento PIX no Asaas
        // A data de vencimento deve ser hoje ou no futuro
        const today = new Date();
        const dueDate = new Date(formattedDate);
        
        // Se a data de vencimento for no passado, usar hoje
        const finalDueDate = dueDate < today ? today : dueDate;
        const dueDateString = finalDueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        
        const paymentData = {
          customerId: asaasCustomer.id,
          value: parseFloat(totalAmount).toFixed(2), // Garantir 2 casas decimais
          dueDate: dueDateString,
          description: `Agendamento #${appointmentId} - ${name}`,
          externalReference: `appointment_${appointmentId}`
        };
        
        console.log('=== DADOS DO PAGAMENTO PIX ===');
        console.log(JSON.stringify(paymentData, null, 2));
        console.log('==============================');
        
        const asaasPayment = await asaas.createPixPayment(paymentData);
        asaasPaymentId = asaasPayment.id;
        
        // Log completo da resposta do Asaas para debug
        console.log('=== RESPOSTA COMPLETA DO ASAAS ===');
        console.log(JSON.stringify(asaasPayment, null, 2));
        console.log('===================================');
        
        // Buscar QR Code PIX após criar o pagamento (endpoint específico)
        try {
            // Tentar buscar QR Code via endpoint específico
            const pixQrCodeData = await asaas.getPixQrCode(asaasPaymentId);
            console.log('=== DADOS DO QR CODE PIX ===');
            console.log(JSON.stringify(pixQrCodeData, null, 2));
            console.log('============================');
            
            if (pixQrCodeData) {
                // Segundo a documentação oficial do Asaas, os campos são:
                // - encodedImage: imagem base64 do QR Code
                // - payload: código PIX para copiar e colar
                // - expirationDate: data de expiração
                pixQrCode = pixQrCodeData.encodedImage || null;
                pixCopiaECola = pixQrCodeData.payload || null;
                
                console.log('✅ QR Code obtido com sucesso:');
                console.log('   - encodedImage:', pixQrCode ? 'Presente' : 'Ausente');
                console.log('   - payload:', pixCopiaECola ? 'Presente' : 'Ausente');
                console.log('   - expirationDate:', pixQrCodeData.expirationDate || 'Não informado');
            }
        } catch (pixError) {
            console.error('Erro ao buscar QR Code PIX via endpoint:', pixError.response?.data || pixError.message);
            // Tentar usar dados da resposta do pagamento como fallback
            pixQrCode = asaasPayment.pixQrCode || 
                       asaasPayment.pixQrCodeBase64 || 
                       asaasPayment.qrCode || 
                       asaasPayment.encodedImage ||
                       null;
            pixCopiaECola = asaasPayment.pixCopiaECola || 
                           asaasPayment.pixCopyPaste || 
                           asaasPayment.copyPaste || 
                           asaasPayment.payload ||
                           null;
        }
        
        // Se ainda não temos o código copia e cola, tentar extrair da resposta do pagamento
        if (!pixCopiaECola && asaasPayment) {
            // Verificar todos os campos possíveis
            const possibleFields = ['pixCopiaECola', 'pixCopyPaste', 'copyPaste', 'payload', 'pixQrCode'];
            for (const field of possibleFields) {
                if (asaasPayment[field]) {
                    pixCopiaECola = asaasPayment[field];
                    break;
                }
            }
        }
        
        paymentUrl = asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl || asaasPayment.transactionReceiptUrl || null;
        
        // Log para debug
        console.log('=== DADOS PIX FINAIS ===');
        console.log('Payment ID:', asaasPaymentId);
        console.log('QR Code:', pixQrCode ? 'Presente (' + pixQrCode.substring(0, 50) + '...)' : 'Ausente');
        console.log('Código Copia e Cola:', pixCopiaECola ? 'Presente (' + pixCopiaECola.substring(0, 50) + '...)' : 'Ausente');
        console.log('Payment URL:', paymentUrl);
        console.log('========================');
        
        // Atualizar agendamento com ID do pagamento e dados PIX
        await connection.query(
          'UPDATE appointments SET asaas_payment_id = ?, payment_method = ?, asaas_pix_qr_code = ?, asaas_pix_code = ? WHERE id = ?',
          [asaasPaymentId, 'asaas_pix', pixQrCode, pixCopiaECola, appointmentId]
        );
      } catch (asaasError) {
        console.error('=== ERRO AO CRIAR PAGAMENTO NO ASAAS ===');
        console.error('Erro completo:', asaasError);
        if (asaasError.response) {
          console.error('Status:', asaasError.response.status);
          console.error('Dados:', JSON.stringify(asaasError.response.data, null, 2));
        }
        console.error('==========================================');
        // Re-throw para que o erro seja tratado no catch principal
        throw new Error('Erro ao criar pagamento no Asaas: ' + (asaasError.response?.data?.message || asaasError.message));
      }
      
      await connection.commit();
      
      // Buscar dados do serviço para retornar o valor
      const [serviceData] = await connection.query(
        'SELECT name, price FROM services WHERE id = ?',
        [service]
      );
      
      // Verificar se temos dados PIX antes de retornar sucesso
      if (!pixQrCode && !pixCopiaECola && totalAmount > 0) {
        console.warn('⚠️ ATENÇÃO: Pagamento criado mas sem QR Code ou código PIX!');
        console.warn('Payment ID:', asaasPaymentId);
        console.warn('Payment Response:', JSON.stringify(asaasPayment, null, 2));
      }
      
      res.json({
        success: true,
        message: 'Agendamento realizado com sucesso!',
        appointmentId: appointmentId,
        paymentUrl: paymentUrl,
        asaasPaymentId: asaasPaymentId,
        pixQrCode: pixQrCode,
        pixCopiaECola: pixCopiaECola,
        value: totalAmount,
        serviceName: serviceData[0]?.name || 'Serviço'
      });
    } catch (error) {
      await connection.rollback();
      console.error('=== ERRO AO CRIAR AGENDAMENTO ===');
      console.error('Erro completo:', error);
      console.error('Stack:', error.stack);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('==================================');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao processar agendamento: ' + error.message,
        error: error.response?.data || error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      if (connection) connection.release();
    }
  },

  // Página de pagamento PIX
  showPayment: async (req, res) => {
    const { slug, id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Buscar dados do agendamento e pagamento
      const [appointments] = await connection.query(
        `SELECT a.*, s.name as service_name, s.price, u.name as user_name, u.email 
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,
        [id]
      );
      
      if (appointments.length === 0) {
        return res.status(404).send('Agendamento não encontrado');
      }
      
      const appointment = appointments[0];
      
      res.render('appointment/payment', {
        business: mockBusiness,
        appointment: appointment,
        slug: slug,
        pixQrCode: appointment.asaas_pix_qr_code || null,
        pixCopiaECola: appointment.asaas_pix_code || null
      });
    } catch (error) {
      console.error('Erro ao carregar página de pagamento:', error);
      res.status(500).send('Erro ao carregar página de pagamento');
    } finally {
      if (connection) connection.release();
    }
  },

  // Página de teste PIX - Página simples com botão
  testPix: (req, res) => {
    res.render('test-pix');
  },

  // API para gerar PIX de teste
  testPixApi: async (req, res) => {
    try {
      console.log('=== INICIANDO TESTE PIX DE R$ 10,00 ===');
      
      // Criar um pagamento PIX de teste de R$ 10,00
      // Usar cliente de teste padrão
      const TEST_CUSTOMER_EMAIL = 'luhandev.vini@gmail.com';
      const TEST_CUSTOMER_NAME = 'Cliente Teste';
      const TEST_CUSTOMER_CPF = '09170048339';
      
      console.log('1. Buscando/criando cliente de teste no Asaas...');
      console.log('   Email:', TEST_CUSTOMER_EMAIL);
      
      // Buscar ou criar cliente de teste no Asaas
      const customerData = {
        name: TEST_CUSTOMER_NAME,
        email: TEST_CUSTOMER_EMAIL,
        cpfCnpj: TEST_CUSTOMER_CPF
      };
      
      const asaasCustomer = await asaas.getOrCreateCustomer(customerData);
      
      console.log('=== RESPOSTA COMPLETA DO CLIENTE ===');
      console.log(JSON.stringify(asaasCustomer, null, 2));
      console.log('=====================================');
      
      if (!asaasCustomer || !asaasCustomer.id) {
        throw new Error('Não foi possível criar ou encontrar o cliente de teste no Asaas');
      }
      
      const customerId = asaasCustomer.id;
      
      console.log('✅ Cliente ID:', customerId);
      console.log('   Nome:', asaasCustomer.name);
      console.log('   Email:', asaasCustomer.email);
      console.log('   CPF:', asaasCustomer.cpfCnpj || 'Não informado');
      
      // Criar pagamento PIX de R$ 10,00
      const today = new Date();
      const dueDate = today.toISOString().split('T')[0];
      
      const paymentData = {
        customerId: customerId, // Usar o ID extraído corretamente
        value: 10.00,
        dueDate: dueDate,
        description: 'Teste PIX - R$ 10,00',
        externalReference: 'test_pix_' + Date.now()
      };
      
      console.log('2. Criando pagamento PIX...');
      console.log('=== DADOS DO PAGAMENTO ===');
      console.log('Customer ID:', customerId);
      console.log('Customer ID (tipo):', typeof customerId);
      console.log('Value:', paymentData.value);
      console.log('Due Date:', paymentData.dueDate);
      console.log('Dados completos:', JSON.stringify(paymentData, null, 2));
      console.log('==========================');
      
      // Validar que temos o customerId antes de enviar
      if (!customerId || customerId === 'undefined' || customerId === 'null') {
        throw new Error('Customer ID inválido: ' + customerId);
      }
      
      const asaasPayment = await asaas.createPixPayment(paymentData);
      const asaasPaymentId = asaasPayment.id;
      
      console.log('✅ Pagamento criado:', asaasPaymentId);
      console.log('=== RESPOSTA COMPLETA DO PAGAMENTO ===');
      console.log(JSON.stringify(asaasPayment, null, 2));
      console.log('========================================');
      
      // Buscar QR Code PIX
      // Segundo a documentação do Asaas: GET /payments/{id}/pixQrCode
      // Retorna: { encodedImage (base64), payload (código copia e cola), expirationDate }
      let pixQrCode = null;
      let pixCopiaECola = null;
      
      console.log('3. Buscando QR Code PIX via endpoint oficial...');
      try {
        const pixQrCodeData = await asaas.getPixQrCode(asaasPaymentId);
        
        if (pixQrCodeData) {
          // Segundo a documentação, os campos são:
          // - encodedImage: imagem base64 do QR Code
          // - payload: código PIX para copiar e colar
          pixQrCode = pixQrCodeData.encodedImage || null;
          pixCopiaECola = pixQrCodeData.payload || null;
          
          console.log('✅ QR Code obtido com sucesso:');
          console.log('   - encodedImage:', pixQrCode ? 'Presente' : 'Ausente');
          console.log('   - payload:', pixCopiaECola ? 'Presente' : 'Ausente');
          console.log('   - expirationDate:', pixQrCodeData.expirationDate || 'Não informado');
        } else {
          console.warn('⚠️ Resposta do QR Code vazia');
        }
      } catch (pixError) {
        console.error('❌ Erro ao buscar QR Code via endpoint:', pixError.response?.data || pixError.message);
        // Não tentar usar dados da resposta do pagamento, pois o QR Code deve ser obtido via endpoint específico
        pixQrCode = null;
        pixCopiaECola = null;
      }
      
      console.log('=== RESULTADO FINAL ===');
      console.log('Payment ID:', asaasPaymentId);
      console.log('QR Code (imagem):', pixQrCode ? '✅ Presente' : '❌ Ausente');
      console.log('Código PIX (copia e cola):', pixCopiaECola ? '✅ Presente (' + pixCopiaECola.substring(0, 50) + '...)' : '❌ Ausente');
      console.log('========================');
      
      res.json({
        success: true,
        message: 'PIX gerado com sucesso!',
        asaasPaymentId: asaasPaymentId,
        pixQrCode: pixQrCode,
        pixCopiaECola: pixCopiaECola,
        value: 10.00
      });
    } catch (error) {
      console.error('=== ERRO NO TESTE PIX ===');
      console.error('Erro completo:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      }
      console.error('Stack:', error.stack);
      console.error('========================');
      
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar PIX: ' + error.message,
        error: error.response?.data || error.message
      });
    }
  },

  // Agendamento concluído
  appointmentDone: async (req, res) => {
    const { slug, id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Buscar dados do agendamento para verificar se o usuário foi cadastrado
      const [appointments] = await connection.query(
        `SELECT a.*, u.name as user_name, u.email as user_email, u.type as user_type
         FROM appointments a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,
        [id]
      );
      
      const appointment = appointments[0] || {};
      let userRegistered = false;
      let userEmail = null;
      
      // Verificar se o usuário foi cadastrado (primeiro pagamento)
      if (appointment.user_id && appointment.payment_status === 'paid') {
        // Verificar se este é o primeiro pagamento do usuário
        const [previousPaid] = await connection.query(
          `SELECT COUNT(*) as total FROM appointments 
           WHERE user_id = ? AND payment_status = 'paid' AND id <= ?`,
          [appointment.user_id, id]
        );
        
        console.log('🔍 Verificando se usuário foi cadastrado:');
        console.log('   user_id:', appointment.user_id);
        console.log('   payment_status:', appointment.payment_status);
        console.log('   Total de pagamentos confirmados:', previousPaid[0].total);
        
        // Se este é o primeiro pagamento confirmado, o usuário foi cadastrado
        if (previousPaid[0].total === 1) {
          userRegistered = true;
          userEmail = appointment.user_email;
          console.log('✅ Primeiro pagamento detectado! Usuário cadastrado:', userEmail);
        } else {
          console.log('ℹ️ Não é o primeiro pagamento ou ainda não foi pago');
        }
      } else {
        console.log('⚠️ Agendamento sem user_id ou não pago ainda');
        console.log('   user_id:', appointment.user_id);
        console.log('   payment_status:', appointment.payment_status);
      }
      
      res.render('appointment/done', {
        business: mockBusiness,
        appointmentId: id,
        slug,
        userRegistered: userRegistered,
        userEmail: userEmail
      });
    } catch (error) {
      console.error('Erro ao carregar página de conclusão:', error);
      res.render('appointment/done', {
        business: mockBusiness,
        appointmentId: id,
        slug,
        userRegistered: false,
        userEmail: null
      });
    } finally {
      if (connection) connection.release();
    }
  },

  // Verificar status do pagamento
  checkPaymentStatus: async (req, res) => {
    console.log('🔍 checkPaymentStatus chamado!');
    console.log('   URL:', req.url);
    console.log('   Parâmetros:', req.params);
    console.log('   ID:', req.params.id);
    const { id } = req.params;
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Buscar agendamento com ID do pagamento Asaas
      const [appointments] = await connection.query(
        `SELECT a.*, s.name as service_name, s.price, u.name as user_name, u.email 
         FROM appointments a
         LEFT JOIN services s ON a.service_id = s.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,
        [id]
      );
      
      if (appointments.length === 0) {
        return res.json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }
      
      const appointment = appointments[0];
      
      // Se não tem ID do pagamento Asaas, retornar status pendente
      if (!appointment.asaas_payment_id) {
        return res.json({
          success: true,
          paid: false,
          status: 'pending',
          message: 'Aguardando criação do pagamento'
        });
      }
      
      // Verificar status do pagamento no Asaas
      try {
        const paymentStatus = await asaas.getPaymentStatus(appointment.asaas_payment_id);
        
        console.log('=== VERIFICAÇÃO DE STATUS DO PAGAMENTO ===');
        console.log('Payment ID:', appointment.asaas_payment_id);
        console.log('Status retornado pelo Asaas:', paymentStatus.status);
        console.log('Status completo:', JSON.stringify(paymentStatus, null, 2));
        
        // Status possíveis no Asaas: PENDING, RECEIVED, OVERDUE, REFUNDED, RECEIVED_IN_CASH, REFUND_REQUESTED, CHARGEBACK_REQUESTED, CHARGEBACK_DISPUTE, AWAITING_CHARGEBACK_REVERSAL, DUNNING_REQUESTED, DUNNING_RECEIVED, AWAITING_RISK_ANALYSIS
        // O Asaas pode retornar o status em português também: "Recebida" = "RECEIVED"
        const statusUpper = String(paymentStatus.status || '').toUpperCase();
        const isPaid = statusUpper === 'RECEIVED' || 
                      statusUpper === 'RECEIVED_IN_CASH' ||
                      statusUpper === 'CONFIRMED' ||
                      statusUpper === 'RECEBIDA' || // Status em português
                      statusUpper === 'PAGO' || // Status alternativo
                      statusUpper === 'CONFIRMADO';
        
        console.log('Status normalizado:', statusUpper);
        console.log('É pago?', isPaid);
        console.log('Status atual no banco:', appointment.payment_status);
        
        // Atualizar status no banco de dados se foi pago
        if (isPaid && appointment.payment_status !== 'paid') {
          console.log('✅ Pagamento confirmado! Atualizando banco de dados...');
          
          await connection.query(
            'UPDATE appointments SET payment_status = ?, status = ? WHERE id = ?',
            ['paid', 'confirmed', id]
          );
          
          // IMPORTANTE: Garantir que o agendamento está vinculado a um usuário
          // Se não tiver user_id, tentar criar/buscar usuário baseado nos dados do agendamento
          if (!appointment.user_id) {
            console.log('⚠️ Agendamento sem user_id! Tentando vincular a usuário...');
            
            // Buscar dados do agendamento para tentar identificar o usuário
            // Se não conseguir, pelo menos garantir que o agendamento tem os dados corretos
            console.warn('⚠️ ATENÇÃO: Agendamento #' + id + ' não está vinculado a nenhum usuário!');
          } else {
            // Verificar se é o primeiro pagamento do usuário e cadastrá-lo se necessário
            const [userData] = await connection.query(
              'SELECT * FROM users WHERE id = ?',
              [appointment.user_id]
            );
            
            if (userData.length > 0) {
              const user = userData[0];
              
              // Verificar se o usuário já tem algum pagamento confirmado anterior
              const [previousPaid] = await connection.query(
                `SELECT COUNT(*) as total FROM appointments 
                 WHERE user_id = ? AND payment_status = 'paid' AND id != ?`,
                [appointment.user_id, id]
              );
              
              const isFirstPayment = previousPaid[0].total === 0;
              
              if (isFirstPayment) {
                console.log('🎉 Primeiro pagamento confirmado! Cadastrando usuário...');
                console.log('   Usuário ID:', user.id);
                console.log('   Nome:', user.name);
                console.log('   Email:', user.email);
                
                // Se o usuário for do tipo 'guest', atualizar para 'new' após primeiro pagamento
                if (user.type === 'guest') {
                  await connection.query(
                    'UPDATE users SET type = ?, role = ? WHERE id = ?',
                    ['new', 'client', user.id]
                  );
                  console.log('✅ Usuário cadastrado com sucesso! Tipo atualizado de "guest" para "new"');
                } else {
                  // Garantir que o usuário tem role 'client' (não admin)
                  if (user.role !== 'admin') {
                    await connection.query(
                      'UPDATE users SET role = ? WHERE id = ? AND (role IS NULL OR role = "")',
                      ['client', user.id]
                    );
                  }
                  console.log('✅ Usuário cadastrado com sucesso!');
                }
                
                // Marcar que o usuário foi cadastrado (para exibir mensagem na tela de conclusão)
                await connection.query(
                  'UPDATE appointments SET additional_details = ? WHERE id = ?',
                  [JSON.stringify({ user_registered: true, first_payment: true }), id]
                );
              } else {
                console.log('ℹ️ Não é o primeiro pagamento. Total de pagamentos anteriores:', previousPaid[0].total);
              }
            } else {
              console.warn('⚠️ Usuário ID ' + appointment.user_id + ' não encontrado no banco de dados!');
            }
          }
          
          console.log('✅ Banco de dados atualizado com sucesso!');
        }
        
        return res.json({
          success: true,
          paid: isPaid,
          status: paymentStatus.status,
          message: isPaid ? 'Pagamento confirmado!' : 'Aguardando confirmação do pagamento'
        });
      } catch (asaasError) {
        console.error('❌ Erro ao verificar status do pagamento no Asaas:', asaasError);
        if (asaasError.response) {
          console.error('Status HTTP:', asaasError.response.status);
          console.error('Dados do erro:', JSON.stringify(asaasError.response.data, null, 2));
        }
        // Em caso de erro, retornar status atual do banco
        return res.json({
          success: true,
          paid: appointment.payment_status === 'paid',
          status: appointment.payment_status || 'pending',
          message: 'Erro ao verificar no Asaas, usando status do banco'
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao verificar status do pagamento'
      });
    } finally {
      if (connection) connection.release();
    }
  },

  // Obter duração do agendamento
  getDuration: async (req, res) => {
    try {
      const { service_id, date } = req.body;
      
      // Converter data de dd-mm-yyyy para yyyy-mm-dd
      const [day, month, year] = date.split('-');
      const formattedDate = `${year}-${month}-${day}`;
      
      // Verificar agendamentos existentes para esta data
      // IMPORTANTE: Considerar TODOS os agendamentos (exceto cancelados) como indisponíveis
      // Isso evita que dois usuários agendem o mesmo horário
      const [existingAppointments] = await pool.query(
        `SELECT TIME_FORMAT(appointment_time, '%H:%i') as time_str, appointment_time
         FROM appointments 
         WHERE appointment_date = ? 
         AND status != "cancelled"`,
        [formattedDate]
      );
      
      console.log('📅 Verificando horários disponíveis para:', formattedDate);
      console.log('   Agendamentos existentes encontrados:', existingAppointments.length);
      existingAppointments.forEach(apt => {
        console.log('   - Horário ocupado:', apt.time_str || apt.appointment_time);
      });

      // Normalizar horários para formato HH:MM para comparação
      const bookedTimes = existingAppointments.map(apt => {
        // Se já está no formato HH:MM, usar direto
        if (apt.time_str) {
          return apt.time_str;
        }
        // Se é TIME do MySQL, converter
        if (typeof apt.appointment_time === 'string') {
          const timeMatch = apt.appointment_time.match(/^(\d{2}):(\d{2})/);
          if (timeMatch) {
            return `${timeMatch[1]}:${timeMatch[2]}`;
          }
        }
        return apt.appointment_time;
      });
      
      // Slots de tempo disponíveis
      const allTimeSlots = [
        '09:00', '10:00', '11:00', '12:00',
        '14:00', '15:00', '16:00', '17:00'
      ];
      
      const timeSlots = allTimeSlots.map(time => ({
        time: time,
        available: !bookedTimes.includes(time)
      }));
      
      res.json({
        success: true,
        timeSlots
      });
    } catch (error) {
      console.error('Erro ao obter horários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar horários disponíveis'
      });
    }
  },

  // Obter dados do staff
  getStaffData: (req, res) => {
    const { service, location } = req.query;
    
    // Mock de staff
    const staffData = [
      {
        user: { id: 1 },
        name: 'Equipe Padrão',
        review: 4.5
      }
    ];
    
    res.json(staffData);
  },

  // Verificar usuário
  checkUser: async (req, res) => {
    const { email, password } = req.body;
    let connection;
    try {
      connection = await pool.getConnection();
      
      // Se não tem senha, apenas verificar se o email existe
      if (!password || password.trim() === '') {
        const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
          return res.json({ success: true, exists: true, message: 'E-mail já cadastrado.' });
        } else {
          return res.json({ success: true, exists: false, message: 'E-mail disponível.' });
        }
      }
      
      // Se tem senha, verificar login completo
      const [rows] = await connection.execute('SELECT id FROM users WHERE email = ? AND password = ?', [email, password]);
      if (rows.length > 0) {
        res.json({ success: true, message: 'Usuário encontrado.', userId: rows[0].id });
      } else {
        res.json({ success: false, message: 'Usuário não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      res.status(500).json({ success: false, message: 'Erro ao verificar usuário.' });
    } finally {
      if (connection) connection.release();
    }
  }
};

module.exports = appointmentController;

