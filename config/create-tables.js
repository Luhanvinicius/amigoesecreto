const pool = require('./database');

async function createTables() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('📊 Criando tabelas no banco de dados...');

        // Tabela de usuários
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255),
                contact VARCHAR(50),
                type ENUM('new', 'existing', 'guest') DEFAULT 'guest',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela users criada');
        
        // Verificar se a coluna role existe, se não, adicionar
        const [roleColumn] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        `);
        
        if (roleColumn.length === 0) {
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN role ENUM('client', 'admin') DEFAULT 'client' 
                AFTER type
            `);
            console.log('✅ Coluna role adicionada à tabela users');
        }
        
        // Criar usuário admin padrão (senha: admin123) - só após garantir que role existe
        await connection.query(`
            INSERT IGNORE INTO users (name, email, password, role, type) 
            VALUES ('Administrador', 'admin@amigoesecreto.com', 'admin123', 'admin', 'new')
        `);
        console.log('✅ Usuário admin padrão criado (email: admin@amigoesecreto.com, senha: admin123)');

        // Tabela de serviços
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                duration INT DEFAULT 30,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela services criada');

        // Tabela de localizações
        await connection.query(`
            CREATE TABLE IF NOT EXISTS locations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela locations criada');

        // Tabela de agendamentos
        await connection.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                service_id INT NOT NULL,
                location_id INT,
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
                payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
                payment_method VARCHAR(50),
                asaas_payment_id VARCHAR(255),
                asaas_invoice_url VARCHAR(500),
                asaas_pix_qr_code TEXT,
                asaas_pix_code TEXT,
                total_amount DECIMAL(10,2) NOT NULL,
                additional_details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
                FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
                INDEX idx_appointment_date (appointment_date),
                INDEX idx_status (status),
                INDEX idx_payment_status (payment_status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela appointments criada');

        // Inserir serviços padrão
        await connection.query(`
            INSERT IGNORE INTO services (id, name, price, duration) VALUES
            (2, 'Conversa Rápida', 20.00, 30),
            (3, 'Conversa Profunda', 40.00, 60),
            (4, 'Mensagem de texto e Áudio', 30.00, 0),
            (5, 'Assinatura Mensal texto e áudio', 150.00, 0),
            (6, 'Assinatura Mensal', 240.00, 0),
            (8, 'Assinatura Semanal', 70.00, 0);
        `);
        console.log('✅ Serviços padrão inseridos');

        // Inserir localizações padrão
        await connection.query(`
            INSERT IGNORE INTO locations (id, name) VALUES
            (2, 'Instagram'),
            (3, 'Whatsapp'),
            (4, 'Chat do site');
        `);
        console.log('✅ Localizações padrão inseridas');

        console.log('🎉 Todas as tabelas foram criadas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao criar tabelas:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    createTables()
        .then(() => {
            console.log('✅ Processo concluído!');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro:', err);
            process.exit(1);
        });
}

module.exports = createTables;

