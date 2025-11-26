const pool = require('../config/database');

async function addRoleColumn() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('🔄 Adicionando coluna role à tabela users...');

        // Verificar se a coluna role existe
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        `);

        if (columns.length === 0) {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN role ENUM('client', 'admin') DEFAULT 'client' 
                AFTER type
            `);
            console.log('✅ Coluna role adicionada à tabela users.');
        } else {
            console.log('ℹ️ Coluna role já existe.');
        }

        // Atualizar role do admin existente ou criar se não existir
        const [adminUsers] = await connection.query(
            "SELECT * FROM users WHERE email = 'admin@amigoesecreto.com'"
        );

        if (adminUsers.length === 0) {
            // Criar admin apenas se a coluna role já existir (será criado no create-tables.js)
            // Aqui só atualizamos se já existir
            console.log('ℹ️ Usuário admin será criado pelo script create-tables.js');
        } else {
            // Atualizar role do admin existente para garantir que seja admin
            await connection.query(`
                UPDATE users 
                SET role = 'admin' 
                WHERE email = 'admin@amigoesecreto.com'
            `);
            console.log('✅ Role do admin atualizado.');
        }

        console.log('🎉 Migração concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao adicionar coluna role:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addRoleColumn()
        .then(() => {
            console.log('✅ Script concluído!');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro:', err);
            process.exit(1);
        });
}

module.exports = addRoleColumn;

