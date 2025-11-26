const pool = require('../config/database');

async function addPixColumns() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('📊 Adicionando colunas PIX à tabela appointments...');

        // Verificar se as colunas já existem
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'appointments' 
            AND COLUMN_NAME IN ('asaas_pix_qr_code', 'asaas_pix_code')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);

        // Verificar todas as colunas Asaas que precisamos
        const [allColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'appointments' 
            AND COLUMN_NAME IN ('asaas_payment_id', 'asaas_invoice_url', 'asaas_pix_qr_code', 'asaas_pix_code')
        `);

        const existingAsaasColumns = allColumns.map(col => col.COLUMN_NAME);

        // 1. Adicionar asaas_payment_id se não existir (primeira coluna Asaas)
        if (!existingAsaasColumns.includes('asaas_payment_id')) {
            await connection.query(`
                ALTER TABLE appointments 
                ADD COLUMN asaas_payment_id VARCHAR(255) NULL 
                AFTER payment_method
            `);
            console.log('✅ Coluna asaas_payment_id adicionada');
            existingAsaasColumns.push('asaas_payment_id');
        } else {
            console.log('ℹ️ Coluna asaas_payment_id já existe');
        }

        // 2. Adicionar asaas_invoice_url se não existir (segunda coluna Asaas)
        if (!existingAsaasColumns.includes('asaas_invoice_url')) {
            const afterClause = existingAsaasColumns.includes('asaas_payment_id') 
                ? 'AFTER asaas_payment_id' 
                : 'AFTER payment_method';
            
            await connection.query(`
                ALTER TABLE appointments 
                ADD COLUMN asaas_invoice_url VARCHAR(500) NULL 
                ${afterClause}
            `);
            console.log('✅ Coluna asaas_invoice_url adicionada');
            existingAsaasColumns.push('asaas_invoice_url');
        } else {
            console.log('ℹ️ Coluna asaas_invoice_url já existe');
        }

        // 3. Adicionar asaas_pix_qr_code se não existir (terceira coluna Asaas)
        if (!existingAsaasColumns.includes('asaas_pix_qr_code')) {
            // Usar a última coluna Asaas existente como referência
            let afterClause = 'AFTER payment_method';
            if (existingAsaasColumns.includes('asaas_invoice_url')) {
                afterClause = 'AFTER asaas_invoice_url';
            } else if (existingAsaasColumns.includes('asaas_payment_id')) {
                afterClause = 'AFTER asaas_payment_id';
            }
            
            await connection.query(`
                ALTER TABLE appointments 
                ADD COLUMN asaas_pix_qr_code TEXT NULL 
                ${afterClause}
            `);
            console.log('✅ Coluna asaas_pix_qr_code adicionada');
            existingAsaasColumns.push('asaas_pix_qr_code');
        } else {
            console.log('ℹ️ Coluna asaas_pix_qr_code já existe');
        }

        // 4. Adicionar asaas_pix_code se não existir (última coluna Asaas)
        if (!existingAsaasColumns.includes('asaas_pix_code')) {
            // Sempre adicionar após asaas_pix_qr_code se existir
            const afterClause = existingAsaasColumns.includes('asaas_pix_qr_code') 
                ? 'AFTER asaas_pix_qr_code' 
                : (existingAsaasColumns.includes('asaas_invoice_url') 
                    ? 'AFTER asaas_invoice_url' 
                    : (existingAsaasColumns.includes('asaas_payment_id') 
                        ? 'AFTER asaas_payment_id' 
                        : 'AFTER payment_method'));
            
            await connection.query(`
                ALTER TABLE appointments 
                ADD COLUMN asaas_pix_code TEXT NULL 
                ${afterClause}
            `);
            console.log('✅ Coluna asaas_pix_code adicionada');
        } else {
            console.log('ℹ️ Coluna asaas_pix_code já existe');
        }

        console.log('🎉 Migração concluída com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao adicionar colunas:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    addPixColumns()
        .then(() => {
            console.log('✅ Processo concluído!');
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Erro:', err);
            process.exit(1);
        });
}

module.exports = addPixColumns;

