const nodemailer = require('nodemailer');

// Configuração do transportador de email
// Por padrão, usa variáveis de ambiente, mas pode funcionar sem configurar
let transporter = null;

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('📧 Serviço de email configurado');
  } else {
    console.log('⚠️ Email não configurado (variáveis SMTP não definidas)');
  }
} catch (error) {
  console.error('❌ Erro ao configurar email:', error.message);
}

const emailService = {
  // Enviar email de confirmação de agendamento
  sendAppointmentConfirmation: async (user, appointment, service) => {
    if (!transporter) {
      console.log('⚠️ Email não enviado (serviço não configurado)');
      return { success: false, message: 'Serviço de email não configurado' };
    }
    
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Amigo e Secreto" <noreply@amigoesecreto.com>',
        to: user.email,
        subject: '✅ Seu agendamento foi confirmado! - Amigo e Secreto',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
              .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
              .label { color: #666; }
              .value { font-weight: 600; }
              .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9rem; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Amigo e Secreto</h1>
                <p>Seu agendamento foi confirmado! 🎉</p>
              </div>
              <div class="content">
                <h2>Olá, ${user.name || 'Cliente'}!</h2>
                <p>Obrigado por agendar uma conversa conosco. Estamos muito felizes em poder ajudar você!</p>
                
                <div class="info-box">
                  <h3>Detalhes do Agendamento</h3>
                  <div class="info-row">
                    <span class="label">Número:</span>
                    <span class="value">#${appointment.id}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Serviço:</span>
                    <span class="value">${service.name}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Valor:</span>
                    <span class="value">R$ ${parseFloat(appointment.total_amount).toFixed(2).replace('.', ',')}</span>
                  </div>
                  ${appointment.appointment_date ? `
                  <div class="info-row">
                    <span class="label">Data:</span>
                    <span class="value">${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  ` : ''}
                  ${appointment.appointment_time ? `
                  <div class="info-row">
                    <span class="label">Horário:</span>
                    <span class="value">${appointment.appointment_time}</span>
                  </div>
                  ` : ''}
                </div>
                
                <div class="info-box" style="background: #e3f2fd; border-left: 4px solid #2196f3;">
                  <h3>📱 Próximos Passos</h3>
                  <p>Entraremos em contato em breve através do Instagram ou WhatsApp para confirmar os detalhes e começar nossa conversa.</p>
                </div>
                
                ${user.password ? `
                <div class="info-box" style="background: #d4edda; border-left: 4px solid #28a745;">
                  <h3>🔐 Seus Dados de Acesso</h3>
                  <p>Você pode acessar sua área de cliente usando:</p>
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${user.email}</span>
                  </div>
                  <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">Use a senha que você cadastrou para acessar.</p>
                </div>
                ` : ''}
                
                <p style="text-align: center;">
                  <a href="${process.env.APP_URL || 'https://amigoesecreto.com'}/login" class="btn">Acessar Minha Conta</a>
                </p>
              </div>
              <div class="footer">
                <p>Dúvidas? Responda este email ou entre em contato pelo Instagram @amigoesecreto</p>
                <p>© ${new Date().getFullYear()} Amigo e Secreto</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email de confirmação enviado para ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return { success: false, message: error.message };
    }
  },
  
  // Notificar admin sobre novo agendamento
  notifyAdminNewAppointment: async (user, appointment, service) => {
    if (!transporter) {
      return { success: false, message: 'Serviço de email não configurado' };
    }
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@amigoesecreto.com';
    
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Amigo e Secreto" <noreply@amigoesecreto.com>',
        to: adminEmail,
        subject: `🔔 Novo Agendamento #${appointment.id} - ${user.name || 'Cliente'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #fff; padding: 20px; border: 1px solid #e0e0e0; }
              .info-box { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔔 Novo Agendamento!</h2>
              </div>
              <div class="content">
                <div class="info-box">
                  <h3>Cliente</h3>
                  <p><strong>Nome:</strong> ${user.name || 'Não informado'}</p>
                  <p><strong>Email:</strong> ${user.email}</p>
                  <p><strong>Telefone:</strong> ${user.contact || 'Não informado'}</p>
                </div>
                
                <div class="info-box">
                  <h3>Agendamento #${appointment.id}</h3>
                  <p><strong>Serviço:</strong> ${service.name}</p>
                  <p><strong>Valor:</strong> R$ ${parseFloat(appointment.total_amount).toFixed(2).replace('.', ',')}</p>
                  ${appointment.appointment_date ? `<p><strong>Data:</strong> ${new Date(appointment.appointment_date).toLocaleDateString('pt-BR')}</p>` : ''}
                  ${appointment.appointment_time ? `<p><strong>Horário:</strong> ${appointment.appointment_time}</p>` : ''}
                </div>
                
                ${appointment.client_expectation ? `
                <div class="info-box">
                  <h3>O que espera da Lia:</h3>
                  <p>${appointment.client_expectation}</p>
                </div>
                ` : ''}
                
                ${appointment.conversation_topic ? `
                <div class="info-box">
                  <h3>Tema da conversa:</h3>
                  <p>${appointment.conversation_topic}</p>
                </div>
                ` : ''}
                
                <p style="text-align: center; margin-top: 20px;">
                  <a href="${process.env.APP_URL || 'https://amigoesecreto.com'}/admin/appointments" 
                     style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                    Ver no Painel
                  </a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Notificação de novo agendamento enviada para ${adminEmail}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return { success: false, message: error.message };
    }
  },
  
  // Enviar email de recuperação de senha
  sendPasswordReset: async (user, resetLink) => {
    if (!transporter) {
      console.log(`🔑 Link de reset (email não configurado): ${resetLink}`);
      return { success: false, message: 'Serviço de email não configurado' };
    }
    
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || '"Amigo e Secreto" <noreply@amigoesecreto.com>',
        to: user.email,
        subject: '🔐 Recuperação de Senha - Amigo e Secreto',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; }
              .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Amigo e Secreto</h1>
                <p>Recuperação de Senha</p>
              </div>
              <div class="content">
                <h2>Olá, ${user.name || 'Cliente'}!</h2>
                <p>Recebemos uma solicitação para redefinir sua senha.</p>
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                
                <p style="text-align: center;">
                  <a href="${resetLink}" class="btn">Redefinir Senha</a>
                </p>
                
                <p style="color: #666; font-size: 0.9rem;">Este link expira em 1 hora.</p>
                <p style="color: #666; font-size: 0.9rem;">Se você não solicitou essa alteração, ignore este email.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`📧 Email de recuperação enviado para ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao enviar email de recuperação:', error);
      return { success: false, message: error.message };
    }
  }
};

module.exports = emailService;


