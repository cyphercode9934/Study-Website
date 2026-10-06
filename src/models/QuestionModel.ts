import { dbPool } from '../config/database';

export interface Question {
    id?: number;
    course_id: number;
    module_num: number;
    topic: string;
    category: 'conceptual' | 'technical_fitb' | 'technical_error_detection';
    question_type: 'multiple_choice' | 'fill_in_blank' | 'identification';
    question_text: string;
    code_snippet?: string;
    options?: string[];
    correct_answer: string;
    explanation: string;
}

export class QuestionModel {
    static async getAll(filters?: { courseId?: number; moduleNum?: number; questionType?: string; category?: string; sortTopic?: string }): Promise<Question[]> {
        let sql = 'SELECT * FROM questions WHERE 1=1';
        const params: any[] = [];

        if (filters?.courseId) { sql += ' AND course_id = ?'; params.push(filters.courseId); }
        if (filters?.moduleNum) { sql += ' AND module_num = ?'; params.push(filters.moduleNum); }
        if (filters?.questionType) { sql += ' AND question_type = ?'; params.push(filters.questionType); }
        if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category); }

        if (filters?.sortTopic === 'asc') {
            sql += ' ORDER BY topic ASC';
        } else if (filters?.sortTopic === 'desc') {
            sql += ' ORDER BY topic DESC';
        } else {
            sql += ' ORDER BY id DESC';
        }

        const [rows] = await dbPool.query(sql, params);
        return rows as Question[];
    }

    static async getById(id: number): Promise<Question | null> {
        const [rows]: any = await dbPool.query('SELECT * FROM questions WHERE id = ?', [id]);
        return rows.length ? rows[0] : null;
    }

    static async create(q: Question): Promise<number> {
        const sql = `INSERT INTO questions 
            (course_id, module_num, topic, category, question_type, question_text, code_snippet, options, correct_answer, explanation) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result]: any = await dbPool.query(sql, [
            q.course_id || 1, q.module_num, q.topic, q.category, q.question_type,
            q.question_text, q.code_snippet || null,
            q.options ? JSON.stringify(q.options) : null,
            q.correct_answer, q.explanation
        ]);
        return result.insertId;
    }

    static async update(id: number, q: Partial<Question>): Promise<boolean> {
        const sql = `UPDATE questions SET 
            course_id = ?, module_num = ?, topic = ?, category = ?, question_type = ?, 
            question_text = ?, code_snippet = ?, options = ?, correct_answer = ?, explanation = ?
            WHERE id = ?`;
        const [result]: any = await dbPool.query(sql, [
            q.course_id, q.module_num, q.topic, q.category, q.question_type,
            q.question_text, q.code_snippet || null,
            q.options ? JSON.stringify(q.options) : null,
            q.correct_answer, q.explanation, id
        ]);
        return result.affectedRows > 0;
    }

    static async delete(id: number): Promise<boolean> {
        const [result]: any = await dbPool.query('DELETE FROM questions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async filterExamQuestions(filters: {
        courseId?: number;
        modules?: number[];
        questionTypes?: string[];
        limit?: number;
    }): Promise<Question[]> {
        let sql = 'SELECT * FROM questions WHERE 1=1';
        const params: any[] = [];

        if (filters.courseId) {
            sql += ' AND course_id = ?';
            params.push(filters.courseId);
        }

        if (filters.modules && filters.modules.length > 0) {
            sql += ` AND module_num IN (${filters.modules.map(() => '?').join(',')})`;
            params.push(...filters.modules);
        }

        if (filters.questionTypes && filters.questionTypes.length > 0) {
            sql += ` AND question_type IN (${filters.questionTypes.map(() => '?').join(',')})`;
            params.push(...filters.questionTypes);
        }

        if (!filters.modules || filters.modules.length === 0) {
            return [];
        }

        if (!filters.questionTypes || filters.questionTypes.length === 0) {
            return [];
        }

        sql += ' ORDER BY RAND() LIMIT ?';
        params.push(filters.limit || 10);

        const [rows] = await dbPool.query(sql, params);
        return rows as Question[];
    }
}