const createTables = require('../config/create-tables');
const addPixColumns = require('./add-pix-columns');
const addRoleColumn = require('./add-role-column');

async function initDatabase() {
    try {
        console.log('🚀 Inicializando banco de dados...');
        await createTables();
        console.log('📊 Adicionando colunas PIX (se necessário)...');
        await addPixColumns();
        console.log('👤 Adicionando coluna role (se necessário)...');
        await addRoleColumn();
        console.log('✅ Banco de dados inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar banco:', error);
        throw error;
    }
}

initDatabase()
    .then(() => {
        process.exit(0);
    })
    .catch(err => {
        process.exit(1);
    });

