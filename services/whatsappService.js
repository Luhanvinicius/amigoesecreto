const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.qrCode = null;
    this.isReady = false;
    this.isAuthenticated = false;
    this.status = 'disconnected'; // disconnected, connecting, qr, ready, authenticated
    this.listeners = {
      qr: [],
      ready: [],
      authenticated: [],
      auth_failure: [],
      disconnected: [],
      message: []
    };
  }

  // Inicializar cliente WhatsApp
  initialize() {
    if (this.client) {
      console.log('⚠️ Cliente WhatsApp já inicializado');
      return;
    }

    console.log('🚀 Inicializando cliente WhatsApp...');
    
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    });

    // Event: QR Code gerado
    this.client.on('qr', async (qr) => {
      console.log('📱 QR Code gerado');
      this.status = 'qr';
      this.qrCode = await qrcode.toDataURL(qr);
      
      // Notificar todos os listeners
      this.listeners.qr.forEach(callback => callback(this.qrCode));
    });

    // Event: Cliente pronto
    this.client.on('ready', () => {
      console.log('✅ WhatsApp cliente pronto!');
      this.status = 'ready';
      this.isReady = true;
      this.qrCode = null;
      
      // Notificar todos os listeners
      this.listeners.ready.forEach(callback => callback());
    });

    // Event: Nova mensagem recebida
    this.client.on('message', async (message) => {
      console.log('📨 Nova mensagem recebida:', message.from, message.body?.substring(0, 50));
      // Notificar listeners de nova mensagem
      if (this.listeners.message) {
        this.listeners.message.forEach(callback => callback(message));
      }
    });

    // Event: Autenticado
    this.client.on('authenticated', () => {
      console.log('✅ WhatsApp autenticado!');
      this.status = 'authenticated';
      this.isAuthenticated = true;
      this.qrCode = null;
      
      // Notificar todos os listeners
      this.listeners.authenticated.forEach(callback => callback());
    });

    // Event: Falha na autenticação
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação WhatsApp:', msg);
      this.status = 'auth_failure';
      this.isAuthenticated = false;
      
      // Notificar todos os listeners
      this.listeners.auth_failure.forEach(callback => callback(msg));
    });

    // Event: Desconectado
    this.client.on('disconnected', (reason) => {
      console.log('⚠️ WhatsApp desconectado:', reason);
      this.status = 'disconnected';
      this.isReady = false;
      this.isAuthenticated = false;
      this.client = null;
      
      // Notificar todos os listeners
      this.listeners.disconnected.forEach(callback => callback(reason));
    });

    // Inicializar cliente
    this.client.initialize().catch(err => {
      console.error('❌ Erro ao inicializar WhatsApp:', err);
      this.status = 'error';
    });
  }

  // Obter status atual
  getStatus() {
    return {
      status: this.status,
      isReady: this.isReady,
      isAuthenticated: this.isAuthenticated,
      hasQRCode: !!this.qrCode
    };
  }

  // Obter QR Code atual
  getQRCode() {
    return this.qrCode;
  }

  // Obter chats/conversas
  async getChats() {
    if (!this.isReady || !this.isAuthenticated) {
      throw new Error('WhatsApp não está pronto ou autenticado');
    }

    try {
      // Verificar se o cliente ainda está válido
      if (!this.client || !this.client.pupPage || this.client.pupPage.isClosed()) {
        console.warn('⚠️ Cliente Puppeteer fechado, tentando reinicializar...');
        throw new Error('Cliente WhatsApp desconectado');
      }

      const chats = await this.client.getChats();
      return chats.map(chat => {
        try {
          return {
            id: chat.id._serialized,
            name: chat.name || chat.pushName || 'Sem nome',
            isGroup: chat.isGroup || false,
            unreadCount: chat.unreadCount || 0,
            lastMessage: chat.lastMessage ? {
              body: chat.lastMessage.body || '',
              timestamp: chat.lastMessage.timestamp
            } : null,
            timestamp: chat.timestamp
          };
        } catch (mapError) {
          // Se houver erro ao mapear um chat específico, retornar dados básicos
          console.warn('Erro ao mapear chat:', mapError);
          return {
            id: chat.id?._serialized || 'unknown',
            name: 'Chat desconhecido',
            isGroup: false,
            unreadCount: 0,
            lastMessage: null,
            timestamp: Date.now()
          };
        }
      }).filter(chat => chat.id !== 'unknown'); // Filtrar chats inválidos
    } catch (error) {
      // Se for erro de "Target closed", tentar reconectar
      if (error.message && (error.message.includes('Target closed') || error.message.includes('Protocol error'))) {
        console.warn('⚠️ Erro de conexão Puppeteer, tentando reconectar...');
        // Não lançar erro, retornar array vazio para não quebrar a interface
        return [];
      }
      console.error('Erro ao obter chats:', error);
      throw error;
    }
  }

  // Obter mensagens de um chat
  async getMessages(chatId, limit = 50) {
    if (!this.isReady || !this.isAuthenticated) {
      throw new Error('WhatsApp não está pronto ou autenticado');
    }

    try {
      let chat;
      try {
        chat = await this.client.getChatById(chatId);
      } catch (chatError) {
        // Se der erro de LID, retornar array vazio
        if (chatError.message && (chatError.message.includes('LID') || chatError.message.includes('No LID'))) {
          console.log('⚠️ Chat sem LID, retornando mensagens vazias. O chat será criado quando você enviar a primeira mensagem.');
          return [];
        }
        // Para outros erros, tentar obter o chat de outra forma
        console.log('⚠️ Erro ao obter chat, tentando alternativa...');
        try {
          const chats = await this.client.getChats();
          const foundChat = chats.find(c => c.id._serialized === chatId);
          if (foundChat) {
            chat = foundChat;
          } else {
            console.log('⚠️ Chat não encontrado, retornando mensagens vazias');
            return [];
          }
        } catch (altError) {
          console.log('⚠️ Erro ao tentar alternativa, retornando mensagens vazias');
          return [];
        }
      }
      
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map(msg => ({
        id: msg.id._serialized,
        body: msg.body || '',
        from: msg.from,
        fromMe: msg.fromMe,
        timestamp: msg.timestamp,
        type: msg.type,
        hasMedia: msg.hasMedia,
        mediaKey: msg.mediaKey
      }));
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      // Se for erro de LID, retornar array vazio em vez de lançar erro
      if (error.message && (error.message.includes('LID') || error.message.includes('No LID'))) {
        console.log('⚠️ Chat sem LID, retornando mensagens vazias');
        return [];
      }
      throw error;
    }
  }

  // Verificar e preparar contato
  async prepareContact(number) {
    let formattedNumber = number;
    
    // Se não contém @c.us, adicionar
    if (!formattedNumber.includes('@c.us')) {
      const cleaned = formattedNumber.replace(/[^0-9]/g, '');
      formattedNumber = `${cleaned}@c.us`;
    }
    
    try {
      // Verificar se o contato existe e obter LID
      const contact = await this.client.getContactById(formattedNumber);
      
      // Se o contato não tem LID, tentar forçar atualização
      if (!contact.lid) {
        console.log('⚠️ Contato sem LID, tentando atualizar...');
        // Aguardar um pouco e tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedContact = await this.client.getContactById(formattedNumber);
        return updatedContact.id._serialized;
      }
      
      return contact.id._serialized;
    } catch (error) {
      console.log('⚠️ Erro ao verificar contato, usando número formatado:', error.message);
      return formattedNumber;
    }
  }

  // Enviar mensagem
  async sendMessage(number, message) {
    if (!this.isReady || !this.isAuthenticated) {
      throw new Error('WhatsApp não está pronto ou autenticado');
    }

    try {
      const formattedNumber = await this.prepareContact(number);
      console.log('📤 Enviando mensagem para:', formattedNumber);
      
      const result = await this.client.sendMessage(formattedNumber, message);
      console.log('✅ Mensagem enviada com sucesso:', result.id._serialized);
      return { success: true, messageId: result.id._serialized };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw new Error(`Erro ao enviar mensagem: ${error.message}`);
    }
  }

  // Enviar arquivo
  async sendFile(number, filePath, caption = '') {
    if (!this.isReady || !this.isAuthenticated) {
      throw new Error('WhatsApp não está pronto ou autenticado');
    }

    try {
      const { MessageMedia } = require('whatsapp-web.js');
      const media = await MessageMedia.fromFilePath(filePath);
      
      const formattedNumber = await this.prepareContact(number);
      console.log('📤 Enviando arquivo para:', formattedNumber);
      
      const options = caption ? { caption: caption } : {};
      const result = await this.client.sendMessage(formattedNumber, media, options);
      console.log('✅ Arquivo enviado com sucesso:', result.id._serialized);
      return { success: true, messageId: result.id._serialized };
    } catch (error) {
      console.error('❌ Erro ao enviar arquivo:', error);
      throw new Error(`Erro ao enviar arquivo: ${error.message}`);
    }
  }

  // Enviar áudio (usando arquivo de áudio)
  async sendAudio(number, audioPath) {
    if (!this.isReady || !this.isAuthenticated) {
      throw new Error('WhatsApp não está pronto ou autenticado');
    }

    try {
      const { MessageMedia } = require('whatsapp-web.js');
      const media = await MessageMedia.fromFilePath(audioPath);
      
      // Forçar tipo de áudio
      if (media.mimetype) {
        media.mimetype = media.mimetype.includes('audio') ? media.mimetype : 'audio/ogg; codecs=opus';
      } else {
        media.mimetype = 'audio/ogg; codecs=opus';
      }
      
      const formattedNumber = await this.prepareContact(number);
      console.log('📤 Enviando áudio para:', formattedNumber);
      
      const result = await this.client.sendMessage(formattedNumber, media);
      console.log('✅ Áudio enviado com sucesso:', result.id._serialized);
      return { success: true, messageId: result.id._serialized };
    } catch (error) {
      console.error('❌ Erro ao enviar áudio:', error);
      throw new Error(`Erro ao enviar áudio: ${error.message}`);
    }
  }

  // Adicionar listener
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  // Remover listener
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  // Desconectar
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.isAuthenticated = false;
      this.status = 'disconnected';
    }
  }

  // Reiniciar
  async restart() {
    await this.disconnect();
    setTimeout(() => {
      this.initialize();
    }, 1000);
  }
}

// Singleton
const whatsappService = new WhatsAppService();

module.exports = whatsappService;

