import pool from './src/config/database';

async function testDatabaseConnection() {
  try {
    // Testa a conexão com o banco de dados
    const connection = await pool.getConnection();
    console.log("Conexão com o banco de dados bem-sucedida!");
  } catch (error) {
    console.error("Erro ao conectar com o banco de dados:", error);
  } finally {
    pool.end(); // Fecha a conexão após o teste
  }
}

testDatabaseConnection();