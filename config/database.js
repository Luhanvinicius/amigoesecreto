const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração para Hostinger
// O phpMyAdmin está em: https://auth-db848.hstgr.io
// 
// IMPORTANTE: Escolha a configuração baseado em ONDE você vai rodar o Node.js:
//
// 1. SE RODAR NO SERVIDOR HOSTINGER (recomendado):
//    - Use: host: 'localhost' ou '127.0.0.1'
//    - NÃO precisa criar conexão remota
//
// 2. SE RODAR NA SUA MÁQUINA LOCAL:
//    - Use: host: 'srv848.hstgr.io' ou '45.132.157.52'
//    - PRECISA criar conexão remota no painel Hostinger primeiro
//    - Adicione seu IP na lista de IPs permitidos
//
const dbConfig = {
    // Para conexão remota com Hostinger (rodando localmente):
    // Use o hostname ou IP fornecido pelo Hostinger
    host: process.env.DB_HOST || 'srv848.hstgr.io', // Hostname do MySQL Hostinger
    user: process.env.DB_USER || 'u342978456_appamigo',
    password: process.env.DB_PASSWORD || '+eO8dj=f@T',
    database: process.env.DB_NAME || 'u342978456_appamigo',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Configurações adicionais para conexões - otimizado para Render
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    // Reconexão automática
    reconnect: true,
    // Manter conexões vivas
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // SSL se necessário
    ssl: false
};

console.log(`🔌 Tentando conectar ao MySQL em: ${dbConfig.host}:${dbConfig.port}`);

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Tratamento de erros do pool
pool.on('connection', (connection) => {
    console.log('✅ Nova conexão MySQL estabelecida:', connection.threadId);
    
    // Configurar reconexão automática em caso de erro
    connection.on('error', (err) => {
        console.error('❌ Erro na conexão MySQL:', err.code);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            console.log('🔄 Tentando reconectar...');
        }
    });
});

// Testar conexão (apenas se não estiver em modo de teste)
if (process.env.NODE_ENV !== 'test') {
    pool.getConnection()
        .then(connection => {
            console.log('✅ Conexão com MySQL estabelecida com sucesso!');
            connection.release();
        })
        .catch(err => {
            console.error('❌ Erro ao conectar com MySQL:', err.message);
            console.error('💡 Dica: Verifique se o MySQL está rodando e se as credenciais estão corretas.');
            console.error('💡 Para servidores remotos, verifique o arquivo .env e configure DB_HOST');
        });
}

// Wrapper para queries com retry automático
const queryWithRetry = async (query, params, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await pool.query(query, params);
        } catch (error) {
            if ((error.code === 'ECONNRESET' || error.code === 'PROTOCOL_CONNECTION_LOST') && i < retries - 1) {
                console.log(`🔄 Tentativa ${i + 1} falhou, tentando novamente...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Espera progressiva
                continue;
            }
            throw error;
        }
    }
};

module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;

module.exports = pool;

