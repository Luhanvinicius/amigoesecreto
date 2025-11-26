require('dotenv').config();
const pool = require('../config/database');

async function addContactStatusColumn() {
  let connection;
  try {
    console.log('🔌 Obtendo conexão do pool...');
    connection = await pool.getConnection();

    console.log('✅ Conectado ao banco de dados');

    // Obter o nome do banco de dados da configuração
    const dbName = process.env.DB_NAME || 'u342978456_appamigo';

    // Verificar se a coluna já existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'contact_status'
    `, [dbName]);

    if (columns.length > 0) {
      console.log('✅ Coluna contact_status já existe');
      return;
    }

    // Adicionar coluna contact_status
    await connection.query(`
      ALTER TABLE appointments 
      ADD COLUMN contact_status ENUM('pending', 'confirmed') DEFAULT 'pending' 
      AFTER payment_status
    `);

    console.log('✅ Coluna contact_status adicionada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.release(); // Usar release() para conexões do pool
      console.log('🔌 Conexão liberada');
    }
  }
}

addContactStatusColumn()
  .then(() => {
    console.log('✅ Processo concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no processo:', error);
    process.exit(1);
  });

