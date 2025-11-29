const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  console.log('Criando tabela de configurações do site...');

  // Criar tabela de configurações
  await connection.execute(`
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
    // Header
    ['site_name', 'Amigo e Secreto', 'text', 'header', 'Nome do Site'],
    ['site_logo', '/images/logo-amigo-secreto.png', 'image', 'header', 'Logo do Site'],
    ['header_phone', '+55 11 99999-9999', 'text', 'header', 'Telefone no Header'],
    
    // Hero Section
    ['hero_title', 'Bem-vindo ao Amigo e Secreto', 'text', 'hero', 'Título Principal'],
    ['hero_subtitle', 'Sua amiga virtual para conversar', 'textarea', 'hero', 'Subtítulo'],
    ['hero_button_text', 'Agende sua Conversa', 'text', 'hero', 'Texto do Botão'],
    ['hero_image', '/images/uploads/about-1024x709.jpg', 'image', 'hero', 'Imagem Principal'],
    
    // About Section
    ['about_title', 'Sobre a Lia', 'text', 'about', 'Título da Seção Sobre'],
    ['about_text', 'A Lia é sua amiga virtual, pronta para ouvir você a qualquer momento. Com ela, você pode desabafar, pedir conselhos ou simplesmente conversar.', 'textarea', 'about', 'Texto Sobre'],
    ['about_image', '/images/uploads/content1.jpg', 'image', 'about', 'Imagem da Seção Sobre'],
    
    // Services Section
    ['services_title', 'Nossos Serviços', 'text', 'services', 'Título da Seção Serviços'],
    ['services_subtitle', 'Escolha o pacote ideal para você', 'textarea', 'services', 'Subtítulo Serviços'],
    
    // Contact Section
    ['contact_title', 'Entre em Contato', 'text', 'contact', 'Título Contato'],
    ['contact_email', 'contato@amigoesecreto.com', 'text', 'contact', 'E-mail de Contato'],
    ['contact_phone', '+55 11 99999-9999', 'text', 'contact', 'Telefone de Contato'],
    ['contact_instagram', '@amigoesecreto', 'text', 'contact', 'Instagram'],
    ['contact_whatsapp', '+5511999999999', 'text', 'contact', 'WhatsApp (apenas números)'],
    
    // Footer
    ['footer_text', '© 2024 Amigo e Secreto. Todos os direitos reservados.', 'textarea', 'footer', 'Texto do Rodapé'],
    
    // Cores
    ['primary_color', '#667eea', 'color', 'colors', 'Cor Primária'],
    ['secondary_color', '#764ba2', 'color', 'colors', 'Cor Secundária'],
    
    // Horários de Trabalho
    ['work_start_hour', '8', 'number', 'schedule', 'Hora de Início (ex: 8)'],
    ['work_end_hour', '20', 'number', 'schedule', 'Hora de Fim (ex: 20)'],
    ['slot_duration', '30', 'number', 'schedule', 'Duração do Slot (minutos)'],
  ];

  for (const [key, value, type, group, label] of defaultSettings) {
    await connection.execute(`
      INSERT IGNORE INTO site_settings (setting_key, setting_value, setting_type, setting_group, setting_label)
      VALUES (?, ?, ?, ?, ?)
    `, [key, value, type, group, label]);
  }

  console.log('✅ Tabela site_settings criada e configurações padrão inseridas!');
  
  await connection.end();
}

migrate().catch(console.error);

