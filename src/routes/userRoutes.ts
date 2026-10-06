import { Router } from 'express';
import { QuestionModel } from '../models/QuestionModel';
import { dbPool } from '../config/database';

const router = Router();

router.post('/generate-exam', async (req, res) => {
    try {
        const {
            userId,
            courseId,
            modules,
            questionTypes,
            limit
        } = req.body;
        const numericUserId = Number(userId);
        const numericCourseId = Number(courseId);
        const selectedModules =
            Array.isArray(modules)
                ? modules.map(Number)
                : [];
        const selectedTypes =
            Array.isArray(questionTypes)
                ? questionTypes
                : [];
        const numericLimit = limit
            ? Number(limit)
            : 10;

        if (!numericUserId || !numericCourseId) {
            return res.status(400).json({
                success: false,
                message: 'User and course are required.'
            });
        }
        if (selectedModules.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Select at least one module.'
            });
        }
        if (selectedTypes.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Select at least one question type.'
            });
        }

        const questions =
            await QuestionModel.filterExamQuestions({
                courseId: numericCourseId,
                modules: selectedModules,
                questionTypes: selectedTypes,
                limit: numericLimit
            });

        if (questions.length === 0) {
            return res.json({
                success: true,
                questions: []
            });
        }

        const [result]: any = await dbPool.query(
            `INSERT INTO exam_sessions
            (
                user_id,
                course_id,
                selected_modules,
                selected_question_types,
                question_limit
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                numericUserId,
                numericCourseId,
                JSON.stringify(selectedModules),
                JSON.stringify(selectedTypes),
                numericLimit
            ]
        );

        res.json({
            success: true,
            sessionId: result.insertId,
            questions
        });
    } catch (err: any) {
        console.error('Generate exam error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/*
 * CHECK ANSWER
 *
 * This immediately records the response for
 * admin analytics.
 */
router.post('/check-answer', async (req, res) => {
    try {
        const {
            userId,
            sessionId,
            questionId,
            selectedAnswer,
            isCorrect
        } = req.body;

        const [sessions]: any = await dbPool.query(
            `SELECT id
             FROM exam_sessions
             WHERE id = ?
             AND user_id = ?
             AND status = 'in_progress'`,
            [sessionId, userId]
        );

        if (sessions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or completed exam session.'
            });
        }

        const answer =
            selectedAnswer == null
                ? ''
                : String(selectedAnswer);

        const correct = Boolean(isCorrect);

        const [existing]: any = await dbPool.query(
            `SELECT id
             FROM exam_responses
             WHERE session_id = ?
             AND question_id = ?`,
            [sessionId, questionId]
        );

        if (existing.length > 0) {
            await dbPool.query(
                `UPDATE exam_responses
                 SET selected_answer = ?,
                     is_correct = ?,
                     was_checked = TRUE,
                     checked_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    answer,
                    correct,
                    existing[0].id
                ]
            );
        } else {
            await dbPool.query(
                `INSERT INTO exam_responses
                (
                    session_id,
                    question_id,
                    selected_answer,
                    is_correct,
                    was_checked,
                    checked_at
                )
                VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)`,
                [
                    sessionId,
                    questionId,
                    answer,
                    correct
                ]
            );
        }
        res.json({
            success: true
        });
    } catch (err: any) {
        console.error('Check answer error:', err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

/*
 * SUBMIT EXAM
 *
 * Every question is recorded.
 * Unanswered questions become wrong.
 * The session is then marked completed.
 */
router.post('/submit-exam', async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const {
            userId,
            sessionId,
            answers
        } = req.body;

        await connection.beginTransaction();

        const [sessions]: any = await connection.query(
            `SELECT id
             FROM exam_sessions
             WHERE id = ?
             AND user_id = ?
             AND status = 'in_progress'
             FOR UPDATE`,
            [sessionId, userId]
        );

        if (sessions.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid or completed exam session.'
            });
        }

        for (const item of answers) {
            const questionId = Number(item.questionId);
            const answer =
                item.selectedAnswer == null
                    ? ''
                    : String(item.selectedAnswer);
            const isCorrect = Boolean(item.isCorrect);

            const [existing]: any = await connection.query(
                `SELECT id
                 FROM exam_responses
                 WHERE session_id = ?
                 AND question_id = ?`,
                [sessionId, questionId]
            );

            if (existing.length > 0) {
                await connection.query(
                    `UPDATE exam_responses
                     SET selected_answer = ?,
                         is_correct = ?,
                         submitted_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [
                        answer,
                        isCorrect,
                        existing[0].id
                    ]
                );
            } else {
                await connection.query(
                    `INSERT INTO exam_responses
                    (
                        session_id,
                        question_id,
                        selected_answer,
                        is_correct,
                        submitted_at
                    )
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        sessionId,
                        questionId,
                        answer,
                        isCorrect
                    ]
                );
            }
        }

        await connection.query(
            `UPDATE exam_sessions
             SET status = 'completed',
                 completed_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [sessionId]
        );

        await connection.commit();
        res.json({
            success: true
        });
    } catch (err: any) {
        await connection.rollback();
        console.error('Submit exam error:', err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        connection.release();
    }
});

router.get('/profile-stats/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        const [summary]: any = await dbPool.query(`
            SELECT
                COUNT(er.id) AS total_attempts,
                COALESCE(SUM(er.is_correct), 0) AS total_correct
            FROM exam_responses er
            JOIN exam_sessions es
                ON er.session_id = es.id
            WHERE es.user_id = ?
            AND es.status = 'completed'
        `, [userId]);

        const [moduleBreakdown]: any =
            await dbPool.query(`
                SELECT
                    q.module_num,
                    COUNT(er.id) AS attempts,
                    COALESCE(SUM(er.is_correct), 0) AS correct
                FROM exam_responses er
                JOIN exam_sessions es
                    ON er.session_id = es.id
                JOIN questions q
                    ON er.question_id = q.id
                WHERE es.user_id = ?
                AND es.status = 'completed'
                GROUP BY q.module_num
                ORDER BY q.module_num
            `, [userId]);

        const [questionBank]: any =
            await dbPool.query(`
                SELECT COUNT(*) AS total_questions
                FROM questions
            `);

        const [answeredQuestions]: any =
            await dbPool.query(`
                SELECT COUNT(DISTINCT er.question_id) AS answered_questions
                FROM exam_responses er
                JOIN exam_sessions es
                    ON er.session_id = es.id
                WHERE es.user_id = ?
                AND es.status = 'completed'
            `, [userId]);
        
        const [examPerformance]: any =
            await dbPool.query(`
                SELECT
                    es.id AS session_id,
                    es.completed_at,
                    COUNT(er.id) AS total_questions,
                    COALESCE(SUM(er.is_correct), 0) AS correct_answers
                FROM exam_sessions es
                JOIN exam_responses er
                    ON er.session_id = es.id
                WHERE es.user_id = ?
                AND es.status = 'completed'
                GROUP BY
                    es.id,
                    es.completed_at
                ORDER BY
                    es.completed_at ASC,
                    es.id ASC
            `, [userId]);

        res.json({
            success: true,
            stats: {
                totalAttempts:
                    summary[0].total_attempts,
                totalCorrect:
                    summary[0].total_correct,
                moduleBreakdown,
                questionBankTotal:
                    Number(questionBank[0].total_questions),
                answeredQuestionCount:
                    Number(answeredQuestions[0].answered_questions),
                examPerformance
            }
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default router;