import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { dbPool } from '../config/database';

const router = Router();

router.post('/login', async (req, res) => {
    const {
        username,
        password
    } = req.body;

    try {
        const [rows]: any =
            await dbPool.query(
                `SELECT *
                 FROM users
                 WHERE username = ?`,
                [username]
            );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = rows[0];

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required.'
        });
    }

    if (username.trim() !== username) {
        return res.status(400).json({
            success: false,
            message: 'Username cannot start or end with spaces.'
        });
    }

    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: 'Username must be at least 3 characters long.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    try {
        const [existingUsers]: any =
            await dbPool.query(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Username already exists.'
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        await dbPool.query(
            `INSERT INTO users
             (username, password, role)
             VALUES (?, ?, 'user')`,
            [username, hashedPassword]
        );

        res.json({
            success: true,
            message: 'Account created successfully.'
        });

    } catch (err: any) {
        console.error('Registration error:', err);

        res.status(500).json({
            success: false,
            message: 'Unable to create account.',
            error: err.message
        });
    }
});

export default router;