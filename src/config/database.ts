import 'dotenv/config';
import mysql from 'mysql2/promise';

export const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'study_web_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});