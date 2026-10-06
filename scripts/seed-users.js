require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seedUsers() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'study_web_db'
    });

    const adminUsername =
        process.env.ADMIN_USERNAME || 'admin';

    const adminPassword =
        process.env.ADMIN_PASSWORD;

    const studentUsername =
        process.env.STUDENT_USERNAME || 'student';

    const studentPassword =
        process.env.STUDENT_PASSWORD;

    if (!adminPassword || !studentPassword) {
        throw new Error(
            'ADMIN_PASSWORD and STUDENT_PASSWORD must be set.'
        );
    }

    const hashedAdminPassword =
        await bcrypt.hash(adminPassword, 10);

    const hashedStudentPassword =
        await bcrypt.hash(studentPassword, 10);

    await db.query(
        `INSERT INTO users
        (username, password, role)
        VALUES (?, ?, 'admin')
        ON DUPLICATE KEY UPDATE
        password = VALUES(password)`,
        [adminUsername, hashedAdminPassword]
    );

    await db.query(
        `INSERT INTO users
        (username, password, role)
        VALUES (?, ?, 'user')
        ON DUPLICATE KEY UPDATE
        password = VALUES(password)`,
        [studentUsername, hashedStudentPassword]
    );

    console.log('Default users created with hashed passwords.');

    await db.end();
}

seedUsers().catch(err => {
    console.error('Failed to seed users:', err);
});