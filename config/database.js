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
    user: 'u342978456_appamigo',
    password: '+eO8dj=f@T',
    database: 'u342978456_appamigo',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Configurações adicionais para conexões
    connectTimeout: 60000
};

console.log(`🔌 Tentando conectar ao MySQL em: ${dbConfig.host}:${dbConfig.port}`);

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

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

module.exports = pool;

