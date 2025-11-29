const pool = require('../config/database');

// Cache das configurações
let settingsCache = null;
let cacheTime = null;
const CACHE_DURATION = 60000; // 1 minuto

async function loadSettings() {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  } catch (error) {
    console.log('Tabela site_settings não existe ainda:', error.message);
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    site_name: 'Amigo e Secreto',
    site_logo: '/images/logo-amigo-secreto.png',
    header_phone: '',
    hero_title: 'Bem-vindo',
    hero_subtitle: 'Sua amiga virtual para conversar',
    hero_button_text: 'Agende sua Conversa',
    hero_image: '/images/uploads/about-1024x709.jpg',
    about_title: 'Sobre',
    about_text: '',
    about_image: '',
    services_title: 'Nossos Serviços',
    services_subtitle: '',
    contact_title: 'Contato',
    contact_email: '',
    contact_phone: '',
    contact_instagram: '',
    contact_whatsapp: '',
    footer_text: '© 2024 Amigo e Secreto. Todos os direitos reservados.',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    work_start_hour: '8',
    work_end_hour: '20',
    slot_duration: '30'
  };
}

// Middleware para adicionar configurações às views
const siteSettingsMiddleware = async (req, res, next) => {
  try {
    // Verificar cache
    const now = Date.now();
    if (!settingsCache || !cacheTime || (now - cacheTime) > CACHE_DURATION) {
      settingsCache = await loadSettings();
      cacheTime = now;
    }
    
    // Adicionar ao res.locals para estar disponível em todas as views
    res.locals.siteSettings = settingsCache;
    next();
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    res.locals.siteSettings = getDefaultSettings();
    next();
  }
};

// Função para invalidar o cache (chamar após salvar)
function invalidateCache() {
  settingsCache = null;
  cacheTime = null;
}

module.exports = {
  siteSettingsMiddleware,
  loadSettings,
  getDefaultSettings,
  invalidateCache
};

