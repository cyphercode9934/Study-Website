import { Router } from 'express';
import { QuestionModel } from '../models/QuestionModel';
import { dbPool } from '../config/database';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/topics', async (req, res) => {
    try {
        const courseId = req.query.courseId ? Number(req.query.courseId) : 1;
        const search = req.query.q ? `${req.query.q}%` : '%';
        const [rows]: any = await dbPool.query(
            'SELECT topic_name FROM topics WHERE course_id = ? AND topic_name LIKE ? ORDER BY topic_name ASC',
            [courseId, search]
        );
        res.json({ success: true, topics: rows.map((r: any) => r.topic_name) });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/courses', async (_req, res) => {
    try {
        const [courses]: any = await dbPool.query(`
            SELECT
                id,
                course_code,
                course_name
            FROM courses
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            courses
        });

    } catch (err: any) {
        console.error('Load courses error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.post('/courses', async (req, res) => {
    try {
        const { course_code, course_name } = req.body;

        if (!course_code || !course_name) {
            return res.status(400).json({
                success: false,
                error: 'Course code and course name are required.'
            });
        }

        const [result]: any = await dbPool.query(
            `INSERT INTO courses
            (course_code, course_name)
            VALUES (?, ?)`,
            [course_code.trim(), course_name.trim()]
        );

        res.json({
            success: true,
            course: {
                id: result.insertId,
                course_code: course_code.trim(),
                course_name: course_name.trim()
            }
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.put('/courses/:id', async (req, res) => {
    try {
        const courseId = Number(req.params.id);
        const { course_code, course_name } = req.body;

        if (!course_code || !course_name) {
            return res.status(400).json({
                success: false,
                error: 'Course code and course name are required.'
            });
        }

        await dbPool.query(
            `UPDATE courses
            SET course_code = ?, course_name = ?
            WHERE id = ?`,
            [
                course_code.trim(),
                course_name.trim(),
                courseId
            ]
        );

        res.json({
            success: true,
            message: 'Course updated successfully.'
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.post('/courses/:id/verify-delete', async (req, res) => {
    try {
        const adminId = Number(req.body.adminId);
        const password = req.body.password;

        if (!adminId || !password) {
            return res.status(400).json({
                success: false,
                error: 'Administrator ID and password are required.'
            });
        }

        const [rows]: any = await dbPool.query(
            `SELECT id, password, role
                FROM users
                WHERE id = ?`,
            [adminId]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Administrator account not found.'
            });
        }

        const admin = rows[0];

        if (admin.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Administrator privileges are required.'
            });
        }

        const passwordValid =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: 'Incorrect administrator password.'
            });
        }

        res.json({
            success: true,
            message: 'Administrator verified.'
        });

    } catch (err: any) {

        console.error(
            'Course delete verification error:',
            err
        );

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
}
);

router.delete('/courses/:id', async (req, res) => {
    try {

        const courseId =
            Number(req.params.id);

        const adminId =
            Number(req.body.adminId);

        if (!adminId) {
            return res.status(400).json({
                success: false,
                error: 'Administrator ID is required.'
            });
        }

        const [admins]: any =
            await dbPool.query(
                `SELECT id, role
                 FROM users
                 WHERE id = ?`,
                [adminId]
            );

        if (
            admins.length === 0 ||
            admins[0].role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                error: 'Administrator privileges are required.'
            });
        }

        const [result]: any =
            await dbPool.query(
                'DELETE FROM courses WHERE id = ?',
                [courseId]
            );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Course not found.'
            });
        }

        res.json({
            success: true,
            message: 'Course deleted successfully.'
        });

    } catch (err: any) {

        console.error(
            'Delete course error:',
            err
        );

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.get('/modules', async (req, res) => {
    try {
        const courseId = Number(req.query.courseId);

        if (!courseId) {
            return res.status(400).json({
                success: false,
                error: 'courseId is required.'
            });
        }

        const [modules]: any = await dbPool.query(
            `SELECT *
             FROM modules
             WHERE course_id = ?
             ORDER BY module_num ASC`,
            [courseId]
        );

        res.json({
            success: true,
            modules
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.post('/modules', async (req, res) => {
    try {
        const {
            course_id,
            module_num,
            module_name
        } = req.body;

        if (
            !course_id ||
            !module_num ||
            !module_name
        ) {
            return res.status(400).json({
                success: false,
                error: 'Course, module number, and module name are required.'
            });
        }

        const [result]: any = await dbPool.query(
            `INSERT INTO modules
            (course_id, module_num, module_name)
            VALUES (?, ?, ?)`,
            [
                course_id,
                module_num,
                module_name.trim()
            ]
        );

        res.json({
            success: true,
            module: {
                id: result.insertId,
                course_id,
                module_num,
                module_name: module_name.trim()
            }
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.put('/modules/:id', async (req, res) => {
    try {
        const moduleId = Number(req.params.id);

        const {
            module_num,
            module_name
        } = req.body;

        if (!module_num || !module_name) {
            return res.status(400).json({
                success: false,
                error: 'Module number and module name are required.'
            });
        }

        await dbPool.query(
            `UPDATE modules
             SET module_num = ?, module_name = ?
             WHERE id = ?`,
            [
                module_num,
                module_name.trim(),
                moduleId
            ]
        );

        res.json({
            success: true,
            message: 'Module updated successfully.'
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.delete('/modules/:id', async (req, res) => {
    try {
        const moduleId = Number(req.params.id);

        await dbPool.query(
            'DELETE FROM modules WHERE id = ?',
            [moduleId]
        );

        res.json({
            success: true,
            message: 'Module deleted successfully.'
        });

    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.get('/questions', async (req, res) => {
    try {
        const filters = {
            courseId: req.query.courseId
                ? Number(req.query.courseId)
                : undefined,

            moduleNum: req.query.moduleNum
                ? Number(req.query.moduleNum)
                : undefined,

            questionType:
                req.query.questionType
                ? String(req.query.questionType)
                : undefined,

            category:
                req.query.category
                ? String(req.query.category)
                : undefined,

            sortTopic:
                req.query.sortTopic
                ? String(req.query.sortTopic)
                : undefined
        };

        console.log('Question Bank filters:', filters);

        const questions =
            await QuestionModel.getAll(filters);

        console.log(
            'Questions returned:',
            questions.length
        );

        res.json({
            success: true,
            questions
        });

    } catch (err: any) {

        console.error(
            'Load Question Bank error:',
            err
        );

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.get('/questions/:id', async (req, res) => {
    try {
        const question = await QuestionModel.getById(Number(req.params.id));
        res.json({ success: true, question });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/questions', async (req, res) => {
    try {
        const { course_id, topic } = req.body;
        await dbPool.query('INSERT IGNORE INTO topics (course_id, topic_name) VALUES (?, ?)', [course_id || 1, topic]);
        const id = await QuestionModel.create(req.body);
        res.json({ success: true, questionId: id });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/questions/:id', async (req, res) => {
    try {
        const updated = await QuestionModel.update(
            Number(req.params.id),
            req.body
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Question not found or was not updated.'
            });
        }

        res.json({
            success: true,
            message: 'Question updated successfully.'
        });
    } catch (err: any) {
        console.error('Question update error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.delete('/questions/:id', async (req, res) => {
    try {
        await QuestionModel.delete(Number(req.params.id));
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/analytics', async (_req, res) => {
    try {
        const [summary]: any = await dbPool.query(`
            SELECT
                COUNT(*) AS total_attempts,
                COALESCE(SUM(is_correct), 0) AS total_correct
            FROM exam_responses
        `);

        const [moduleBreakdown]: any = await dbPool.query(`
            SELECT
                q.module_num,
                COUNT(er.id) AS attempts,
                COALESCE(SUM(er.is_correct), 0) AS correct
            FROM exam_responses er
            JOIN questions q
                ON er.question_id = q.id
            GROUP BY q.module_num
            ORDER BY q.module_num
        `);

        const [questionBreakdown]: any = await dbPool.query(`
            SELECT
                q.id,
                q.topic,
                q.module_num,
                q.question_type,
                COUNT(er.id) AS attempts,
                COALESCE(SUM(er.is_correct), 0) AS correct
            FROM questions q
            LEFT JOIN exam_responses er
                ON q.id = er.question_id
            GROUP BY
                q.id,
                q.topic,
                q.module_num,
                q.question_type
            ORDER BY attempts DESC, q.id ASC
        `);

        res.json({
            success: true,
            summary: summary[0],
            moduleBreakdown,
            questionBreakdown
        });

    } catch (err: any) {
        console.error('Analytics error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// GET ALL USERS
router.get('/users', async (_req, res) => {
    try {
        const [users]: any = await dbPool.query(
            `SELECT
                id,
                username,
                role,
                created_at
             FROM users
             ORDER BY id ASC`
        );

        res.json({
            success: true,
            users
        });

    } catch (err: any) {
        console.error('Get users error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// CHANGE USER ROLE
router.put('/users/:id/role', async (req, res) => {
    const userId = Number(req.params.id);
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role.'
        });
    }

    try {
        const [result]: any = await dbPool.query(
            `UPDATE users
             SET role = ?
             WHERE id = ?`,
            [role, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully.'
        });

    } catch (err: any) {
        console.error('Update role error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// DELETE USER
router.delete('/users/:id', async (req, res) => {
    const userId = Number(req.params.id);
    const adminId = Number(req.body.adminId);

    if (!adminId) {
        return res.status(400).json({
            success: false,
            message: 'Admin ID is required.'
        });
    }

    if (userId === adminId) {
        return res.status(403).json({
            success: false,
            message: 'You cannot delete your own account.'
        });
    }

    try {
        const [result]: any = await dbPool.query(
            'DELETE FROM users WHERE id = ?',
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully.'
        });

    } catch (err: any) {
        console.error('Delete user error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default router;