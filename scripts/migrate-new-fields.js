const pool = require('../config/database');

async function migrateNewFields() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('📊 Adicionando novos campos ao banco de dados...');

        // Adicionar campos na tabela users
        const userColumns = [
            { name: 'gender', sql: "ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_say') DEFAULT NULL AFTER contact" },
            { name: 'instagram', sql: "ADD COLUMN instagram VARCHAR(100) DEFAULT NULL AFTER gender" },
            { name: 'assigned_attendant_id', sql: "ADD COLUMN assigned_attendant_id INT DEFAULT NULL AFTER instagram" },
            { name: 'reset_token', sql: "ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL AFTER assigned_attendant_id" },
            { name: 'reset_token_expires', sql: "ADD COLUMN reset_token_expires DATETIME DEFAULT NULL AFTER reset_token" }
        ];

        for (const col of userColumns) {
            try {
                const [existing] = await connection.query(`
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?
                `, [col.name]);
                
                if (existing.length === 0) {
                    await connection.query(`ALTER TABLE users ${col.sql}`);
                    console.log(`✅ Coluna ${col.name} adicionada à tabela users`);
                } else {
                    console.log(`ℹ️ Coluna ${col.name} já existe na tabela users`);
                }
            } catch (err) {
                console.log(`⚠️ Erro ao adicionar coluna ${col.name}: ${err.message}`);
            }
        }

        // Adicionar campos na tabela appointments
        const appointmentColumns = [
            { name: 'admin_notes', sql: "ADD COLUMN admin_notes TEXT DEFAULT NULL AFTER additional_details" },
            { name: 'attendant_notes', sql: "ADD COLUMN attendant_notes TEXT DEFAULT NULL AFTER admin_notes" },
            { name: 'assigned_attendant_id', sql: "ADD COLUMN assigned_attendant_id INT DEFAULT NULL AFTER attendant_notes" },
            { name: 'client_expectation', sql: "ADD COLUMN client_expectation TEXT DEFAULT NULL AFTER assigned_attendant_id" },
            { name: 'conversation_topic', sql: "ADD COLUMN conversation_topic TEXT DEFAULT NULL AFTER client_expectation" },
            { name: 'client_instagram', sql: "ADD COLUMN client_instagram VARCHAR(100) DEFAULT NULL AFTER conversation_topic" },
            { name: 'requires_schedule', sql: "ADD COLUMN requires_schedule TINYINT(1) DEFAULT 1 AFTER client_instagram" }
        ];

        for (const col of appointmentColumns) {
            try {
                const [existing] = await connection.query(`
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = ?
                `, [col.name]);
                
                if (existing.length === 0) {
                    await connection.query(`ALTER TABLE appointments ${col.sql}`);
                    console.log(`✅ Coluna ${col.name} adicionada à tabela appointments`);
                } else {
                    console.log(`ℹ️ Coluna ${col.name} já existe na tabela appointments`);
                }
            } catch (err) {
                console.log(`⚠️ Erro ao adicionar coluna ${col.name}: ${err.message}`);
            }
        }

        // Adicionar campos na tabela services
        const serviceColumns = [
            { name: 'requires_schedule', sql: "ADD COLUMN requires_schedule TINYINT(1) DEFAULT 1 AFTER description" },
            { name: 'is_subscription', sql: "ADD COLUMN is_subscription TINYINT(1) DEFAULT 0 AFTER requires_schedule" },
            { name: 'payment_link', sql: "ADD COLUMN payment_link VARCHAR(500) DEFAULT NULL AFTER is_subscription" },
            { name: 'default_attendant_id', sql: "ADD COLUMN default_attendant_id INT DEFAULT NULL AFTER payment_link" }
        ];

        for (const col of serviceColumns) {
            try {
                const [existing] = await connection.query(`
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'services' AND COLUMN_NAME = ?
                `, [col.name]);
                
                if (existing.length === 0) {
                    await connection.query(`ALTER TABLE services ${col.sql}`);
                    console.log(`✅ Coluna ${col.name} adicionada à tabela services`);
                } else {
                    console.log(`ℹ️ Coluna ${col.name} já existe na tabela services`);
                }
            } catch (err) {
                console.log(`⚠️ Erro ao adicionar coluna ${col.name}: ${err.message}`);
            }
        }

        // Atualizar serviços existentes - Mensagem/Áudio não precisam de horário
        await connection.query(`
            UPDATE services SET requires_schedule = 0 
            WHERE id IN (4, 5) OR name LIKE '%texto%' OR name LIKE '%áudio%' OR name LIKE '%mensagem%'
        `);
        console.log('✅ Serviços de mensagem/áudio atualizados para não requerer horário');

        // Criar tabela de chat
        await connection.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_sender (sender_id),
                INDEX idx_receiver (receiver_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela chat_messages criada');

        // Criar tabela de atendentes
        await connection.query(`
            CREATE TABLE IF NOT EXISTS attendants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                display_name VARCHAR(100) DEFAULT 'Lia',
                real_name VARCHAR(255) NOT NULL,
                handles_calls TINYINT(1) DEFAULT 1,
                handles_messages TINYINT(1) DEFAULT 1,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela attendants criada');

        // Criar tabela de histórico/CRM do cliente
        await connection.query(`
            CREATE TABLE IF NOT EXISTS client_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                appointment_id INT DEFAULT NULL,
                attendant_id INT DEFAULT NULL,
                note_type ENUM('observation', 'attendance', 'purchase', 'contact') DEFAULT 'observation',
                notes TEXT,
                created_by INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
                INDEX idx_user (user_id),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Tabela client_history criada');

        // Criar tabela de configurações de pagamento
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payment_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                payment_method VARCHAR(50) NOT NULL,
                is_active TINYINT(1) DEFAULT 0,
                config JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_method (payment_method)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        
        // Inserir métodos de pagamento padrão
        await connection.query(`
            INSERT IGNORE INTO payment_settings (payment_method, is_active, config) VALUES
            ('asaas_pix', 1, '{"name": "PIX (Asaas)"}'),
            ('paypal', 0, '{"name": "PayPal", "client_id": "", "secret": ""}'),
            ('manual', 1, '{"name": "Pagamento Manual"}')
        `);
        console.log('✅ Tabela payment_settings criada e configurada');

        console.log('🎉 Migração concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    migrateNewFields()
        .then(() => {
            console.log('✅ Processo concluído!');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro:', err);
            process.exit(1);
        });
}

module.exports = migrateNewFields;

