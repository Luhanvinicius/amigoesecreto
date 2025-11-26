const pool = require('../config/database');

async function createAdmin() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('👤 Criando usuário administrador...');

        const adminEmail = 'admin@amigoesecreto.com';
        const adminPassword = 'admin123';
        const adminName = 'Administrador';

        // Verificar se o admin já existe
        const [existing] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existing.length > 0) {
            // Atualizar para garantir que é admin
            await connection.query(
                'UPDATE users SET name = ?, password = ?, role = "admin", type = "new" WHERE email = ?',
                [adminName, adminPassword, adminEmail]
            );
            console.log('✅ Usuário admin atualizado!');
            console.log('   Email:', adminEmail);
            console.log('   Senha:', adminPassword);
        } else {
            // Criar novo admin
            await connection.query(
                'INSERT INTO users (name, email, password, role, type) VALUES (?, ?, ?, "admin", "new")',
                [adminName, adminEmail, adminPassword]
            );
            console.log('✅ Usuário admin criado com sucesso!');
            console.log('   Email:', adminEmail);
            console.log('   Senha:', adminPassword);
        }

        console.log('\n📋 Credenciais de acesso:');
        console.log('   URL: http://localhost:3000/login');
        console.log('   Email:', adminEmail);
        console.log('   Senha:', adminPassword);
        console.log('\n✅ Pronto! Você pode fazer login agora.');

    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createAdmin()
        .then(() => {
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro:', err);
            process.exit(1);
        });
}

module.exports = createAdmin;



