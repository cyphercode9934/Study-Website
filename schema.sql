-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO courses (id, course_code, course_name) VALUES 
(1, 'CS0011', 'Mobile Programming'),
(2, '?', 'Coming Soon...');

CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    module_num INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_course_module
        (course_id, module_num)
);

INSERT IGNORE INTO modules
(course_id, module_num, module_name)
VALUES
(1, 1, 'Introduction to Android'),
(1, 2, 'Android Studio'),
(1, 3, 'Kotlin'),
(1, 4, 'Application Components & Resources'),
(1, 5, 'Activities'),

(2, 1, 'Module 1');

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Topics Table (Bound to Course)
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_course_topic (course_id, topic_name)
);

-- 4. Questions Bank Table
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL DEFAULT 1,
    module_num INT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    category ENUM('conceptual', 'technical_fitb', 'technical_error_detection') NOT NULL,
    question_type ENUM('multiple_choice', 'fill_in_blank', 'identification') NOT NULL,
    question_text TEXT NOT NULL,
    code_snippet TEXT DEFAULT NULL,
    options JSON DEFAULT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 5. Exam Sessions
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    course_id INT NOT NULL,

    selected_modules JSON NOT NULL,
    selected_question_types JSON NOT NULL,

    question_limit INT NOT NULL,

    status ENUM('in_progress', 'completed')
        NOT NULL DEFAULT 'in_progress',

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (course_id)
        REFERENCES courses(id)
        ON DELETE CASCADE
);

-- 6. Exam Responses
CREATE TABLE IF NOT EXISTS exam_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    session_id INT NOT NULL,
    question_id INT NOT NULL,

    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,

    was_checked BOOLEAN NOT NULL DEFAULT FALSE,

    checked_at TIMESTAMP NULL DEFAULT NULL,
    submitted_at TIMESTAMP NULL DEFAULT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id)
        REFERENCES exam_sessions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    UNIQUE KEY unique_session_question
        (session_id, question_id)
);

-- Default Topics
INSERT IGNORE INTO topics (course_id, topic_name) VALUES
(1, 'Activity Basics'),
(1, 'Activity Creation'),
(1, 'Activity Execution'),
(1, 'Activity Lifecycle'),
(1, 'Activity Manifest'),
(1, 'Android Architecture'),
(1, 'Android History'),
(1, 'Android Overview'),
(1, 'Android Studio'),
(1, 'Android Versions'),
(1, 'Application Components'),
(1, 'Deployment'),
(1, 'IDE Interface'),
(1, 'Kotlin Android'),
(1, 'Kotlin Basics'),
(1, 'Kotlin Comments'),
(1, 'Kotlin Control Flow'),
(1, 'Kotlin Conversion'),
(1, 'Kotlin Features'),
(1, 'Kotlin Fundamentals'),
(1, 'Kotlin Interoperability'),
(1, 'Kotlin Loops'),
(1, 'Kotlin Null Safety'),
(1, 'Kotlin Objects'),
(1, 'Kotlin OOP'),
(1, 'Kotlin Overview'),
(1, 'Kotlin Syntax'),
(1, 'Kotlin vs Java'),
(1, 'Project Creation'),
(1, 'Resources Access'),
(1, 'Resources Organization'),
(1, 'System Requirements');