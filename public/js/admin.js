const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') window.location.href = 'index.html';

function logout() {
    const confirmed = confirm( 'Are you sure you want to log out?' );

    if (!confirmed) { return; }

    localStorage.clear();
    window.location.href = 'index.html';
}

let currentOptions = ['', ''];
let selectedCorrectOption = 0;

function showAdminStatus(message, type = 'info') {
    const element =
        document.getElementById('adminStatus');

    if (!element) return;

    element.textContent = message;

    element.className =
        `status-message ${type} show`;
}

function clearAdminStatus() {
    const element =
        document.getElementById('adminStatus');

    if (!element) return;

    element.textContent = '';
    element.className = 'status-message';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await fetchCourses();
    setupEventListeners();
    renderDynamicFields();
    await loadQuestions();
}

function setupEventListeners() {
    document.getElementById('course_id').addEventListener('change', () => {
        document.getElementById('topic').value = '';
    });

    const topicInput = document.getElementById('topic');
    const topicSuggestions =
        document.getElementById('topicSuggestions');

    topicInput.addEventListener('blur', () => {
        setTimeout(() => {
            topicSuggestions.style.display = 'none';
        }, 150);
    });

    topicSuggestions.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    document.getElementById('topic').addEventListener('input', onTopicInput);
    document.getElementById('question_type').addEventListener('change', renderDynamicFields);

    document.getElementById('filter_course').addEventListener('change', loadQuestions);
    document.getElementById('filter_module').addEventListener('change', loadQuestions);
    document.getElementById('filter_type').addEventListener('change', loadQuestions);
    document.getElementById('filter_category').addEventListener('change', loadQuestions);
    document.getElementById('filter_sort').addEventListener('change', loadQuestions);

    document.getElementById('questionForm').addEventListener('submit', handleFormSubmit);
}

function switchAdminTab(tab) {
    const views = {
        editor: document.getElementById('editorView'),
        bank: document.getElementById('bankView'),
        courses: document.getElementById('coursesView'),
        analytics: document.getElementById('analyticsView'),
        users: document.getElementById('usersView')
    };

    const buttons = {
        editor: document.getElementById('editorTab'),
        bank: document.getElementById('bankTab'),
        courses: document.getElementById('coursesTab'),
        analytics: document.getElementById('analyticsTab'),
        users: document.getElementById('usersTab')
    };

    Object.keys(views).forEach(key => {
        if (!views[key]) return;

        views[key].style.display =
            key === tab ? 'block' : 'none';

        if (buttons[key]) {
            buttons[key].classList.toggle(
                'active',
                key === tab
            );
        }
    });

    if (tab === 'analytics') {
        loadAnalytics();
    }

    if (tab === 'users') {
        loadUsers();
    }

    if (tab === 'courses') {
        loadCoursesManager();
    }
}

async function fetchCourses() {
    try {
        const res =
            await fetch('/api/admin/courses');

        const data =
            await res.json();

        console.log(
            'Courses response:',
            data
        );

        if (!res.ok || !data.success) {
            throw new Error(
                data.error || 'Failed to load courses.'
            );
        }

        const select =
            document.getElementById('course_id');

        const filterSelect =
            document.getElementById('filter_course');

        const optionsHtml =
            data.courses.map(course => `
                <option value="${course.id}">
                    ${escapeHtml(course.course_code)}
                    -
                    ${escapeHtml(course.course_name)}
                </option>
            `).join('');

        select.innerHTML = optionsHtml;

        filterSelect.innerHTML =
            '<option value="">All</option>' +
            optionsHtml;

    } catch (error) {

        console.error(
            'Failed to load courses:',
            error
        );
    }
}

async function onTopicInput() {
    const query = document.getElementById('topic').value;
    const courseId = document.getElementById('course_id').value;
    const suggestionsContainer = document.getElementById('topicSuggestions');

    if (!query) { suggestionsContainer.style.display = 'none'; return; }

    const res = await fetch(`/api/admin/topics?courseId=${courseId}&q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.success && data.topics.length) {
        suggestionsContainer.innerHTML = data.topics.map(t => `<div class="suggestion-item" onclick="selectTopic('${t}')">${t}</div>`).join('');
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function selectTopic(name) {
    document.getElementById('topic').value = name;
    document.getElementById('topicSuggestions').style.display = 'none';
}

function renderDynamicFields() {
    const type = document.getElementById('question_type').value;
    const container = document.getElementById('dynamicFieldsContainer');

    container.replaceChildren();

    if (type === 'multiple_choice') {
        const label = document.createElement('label');

        label.textContent =
            'Multiple Choice Options (Select the radio button for the correct answer)';

        container.appendChild(label);

        currentOptions.forEach((opt, i) => {
            const row = document.createElement('div');
            row.className = 'option-row';

            const radio = document.createElement('input');

            radio.type = 'radio';
            radio.name = 'correct_opt';
            radio.value = i;
            radio.checked = selectedCorrectOption === i;

            radio.addEventListener('change', () => {
                selectedCorrectOption = i;
            });

            const input = document.createElement('input');

            input.type = 'text';
            input.value = opt;
            input.placeholder = `Option ${i + 1}`;
            input.required = true;

            input.addEventListener('input', () => {
                currentOptions[i] = input.value;
            });

            row.append(
                radio,
                input
            );

            if (currentOptions.length > 2) {
                const removeButton = document.createElement('button');

                removeButton.type = 'button';
                removeButton.className = 'danger-btn';
                removeButton.textContent = 'X';

                removeButton.addEventListener('click', () => {
                    removeOption(i);
                });

                row.appendChild(removeButton);
            }

            container.appendChild(row);
        });

        const addButton = document.createElement('button');

        addButton.type = 'button';
        addButton.textContent = '+ Add Option';

        addButton.addEventListener('click', addOption);

        container.appendChild(addButton);

    } else {
        const label = document.createElement('label');

        label.textContent =
            'Correct Answer (Exact spelling, case-insensitive)';

        const input = document.createElement('input');

        input.type = 'text';
        input.id = 'single_correct_answer';
        input.required = true;
        input.placeholder = 'Type correct answer...';

        container.append(
            label,
            input
        );
    }
}

function addOption() { currentOptions.push(''); renderDynamicFields(); }
function removeOption(idx) { 
    currentOptions.splice(idx, 1); 
    if (selectedCorrectOption >= currentOptions.length) selectedCorrectOption = 0;
    renderDynamicFields(); 
}

async function loadQuestions() {
    const courseId =
        document.getElementById('filter_course').value;

    const moduleNum =
        document.getElementById('filter_module').value;

    const questionType =
        document.getElementById('filter_type').value;

    const category =
        document.getElementById('filter_category').value;

    const sortTopic =
        document.getElementById('filter_sort').value;

    const params = new URLSearchParams();

    if (courseId) {
        params.append('courseId', courseId);
    }

    if (moduleNum) {
        params.append('moduleNum', moduleNum);
    }

    if (questionType) {
        params.append('questionType', questionType);
    }

    if (category) {
        params.append('category', category);
    }

    if (sortTopic) {
        params.append('sortTopic', sortTopic);
    }

    try {
        const res = await fetch(
            `/api/admin/questions?${params.toString()}`
        );

        const data = await res.json();

        console.log('Question Bank response:', data);

        if (!res.ok) {
            throw new Error(
                data.error || 'Failed to load questions.'
            );
        }

        if (!data.success) {
            throw new Error(
                data.error || 'Question request failed.'
            );
        }

        const container =
            document.getElementById('questionsContainer');

        if (!data.questions || data.questions.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <p>No questions found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.questions.map(q => `
            <div class="card">
                <strong>
                    [Course ${q.course_id} |
                    Module ${q.module_num}]
                    ${escapeHtml(q.topic)}
                </strong>

                |
                <em>
                    ${escapeHtml(q.category)}
                </em>

                (${escapeHtml(q.question_type)})

                <p class="truncate">
                    ${escapeHtml(q.question_text)}
                </p>

                <button onclick="editQuestion(${q.id})">
                    Edit
                </button>

                <button
                    onclick="deleteQuestion(${q.id})"
                    class="danger-btn"
                >
                    Delete
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error(
            'Failed to load Question Bank:',
            error
        );

        document.getElementById(
            'questionsContainer'
        ).innerHTML = `
            <div class="card">
                <p>
                    Failed to load questions:
                    ${escapeHtml(error.message)}
                </p>
            </div>
        `;
    }
}

async function editQuestion(id) {
    const res = await fetch(`/api/admin/questions/${id}`);
    const data = await res.json();

    if (!data.success) {
        showAdminStatus(
            data.message ||
            data.error ||
            'Unable to load question.',
            'error'
        );

        return;
    }

    const q = data.question;

    document.getElementById('edit_id').value = q.id;
    document.getElementById('course_id').value = q.course_id;
    document.getElementById('topic').value = q.topic;
    document.getElementById('module_num').value = q.module_num;
    document.getElementById('category').value = q.category;
    document.getElementById('question_type').value = q.question_type;
    document.getElementById('question_text').value = q.question_text;
    document.getElementById('code_snippet').value =
        q.code_snippet || '';
    document.getElementById('explanation').value =
        q.explanation;

    if (q.question_type === 'multiple_choice') {
        currentOptions =
            typeof q.options === 'string'
                ? JSON.parse(q.options)
                : q.options || ['', ''];

        selectedCorrectOption =
            currentOptions.indexOf(q.correct_answer);

        if (selectedCorrectOption === -1) {
            selectedCorrectOption = 0;
        }
    } else {
        currentOptions = ['', ''];
        selectedCorrectOption = 0;
    }

    renderDynamicFields();

    if (q.question_type !== 'multiple_choice') {
        document.getElementById(
            'single_correct_answer'
        ).value = q.correct_answer;
    }

    document.getElementById('formTitle').innerText =
        'Edit Question #' + q.id;

    document.getElementById('saveBtn').innerText =
        'Update Question';

    /*
     * Automatically switch from Question Bank
     * to Question Editor.
     */
    switchAdminTab('editor');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

async function deleteQuestion(id) {
    if (!confirm('Delete this question?')) { return; }

    try {
        const res = await fetch(
            `/api/admin/questions/${id}`,
            {
                method: 'DELETE'
            }
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            showAdminStatus(
                data.message ||
                data.error ||
                'Unable to delete question.',
                'error'
            );

            return;
        }

        showAdminStatus(
            'Question deleted successfully.',
            'success'
        );

        loadQuestions();

    } catch (error) {
        console.error(
            'Delete question error:',
            error
        );

        showAdminStatus(
            'Unable to connect to the server.',
            'error'
        );
    }
}

function resetForm() {
    document.getElementById('questionForm').reset();
    document.getElementById('edit_id').value = '';
    currentOptions = ['', ''];
    selectedCorrectOption = 0;
    renderDynamicFields();
    document.getElementById('formTitle').innerText = 'Add / Edit Question';
    document.getElementById('saveBtn').innerText = 'Save Question';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const editId = document.getElementById('edit_id').value;
    const type = document.getElementById('question_type').value;

    let correctAnswer = '';
    let options = null;

    if (type === 'multiple_choice') {
        options = currentOptions;
        correctAnswer = currentOptions[selectedCorrectOption];
    } else {
        correctAnswer = document.getElementById('single_correct_answer').value;
    }

    const payload = {
        course_id: Number(document.getElementById('course_id').value),
        module_num: Number(document.getElementById('module_num').value),
        topic: document.getElementById('topic').value,
        category: document.getElementById('category').value,
        question_type: type,
        question_text: document.getElementById('question_text').value,
        code_snippet: document.getElementById('code_snippet').value || null,
        options,
        correct_answer: correctAnswer,
        explanation: document.getElementById('explanation').value
    };

    const url = editId ? `/api/admin/questions/${editId}` : '/api/admin/questions';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
        showAdminStatus(
            data.message ||
            data.error ||
            'Failed to save question.',
            'error'
        );
        return;
    }

    showAdminStatus(
        editId
            ? 'Question updated successfully!'
            : 'Question created successfully!',
        'success'
    );

    resetForm();
    loadQuestions();
}

async function loadAnalytics() {
    const res = await fetch('/api/admin/analytics');
    const data = await res.json();

    if (!res.ok || !data.success) {
        document.getElementById('analyticsSummary').textContent =
            'Unable to load analytics.';
        return;
    }

    const summary = data.summary;

    const totalAttempts = Number(summary.total_attempts) || 0;
    const totalCorrect = Number(summary.total_correct) || 0;

    const accuracy = totalAttempts
        ? Math.round((totalCorrect / totalAttempts) * 100)
        : 0;

    const summaryContainer =
        document.getElementById('analyticsSummary');

    summaryContainer.replaceChildren();

    const summaryCard = document.createElement('div');
    summaryCard.className = 'card';

    const title = document.createElement('h4');
    title.textContent = 'Overall Performance';

    const text = document.createElement('p');
    text.textContent =
        `Attempts: ${totalAttempts} | ` +
        `Correct: ${totalCorrect} | ` +
        `Accuracy: ${accuracy}%`;

    summaryCard.append(title, text);
    summaryContainer.appendChild(summaryCard);


    const moduleContainer =
        document.getElementById('moduleAnalytics');

    moduleContainer.replaceChildren();

    data.moduleBreakdown.forEach(module => {
        const card = document.createElement('div');
        card.className = 'card';

        const attempts = Number(module.attempts);
        const correct = Number(module.correct);

        const percentage = attempts
            ? Math.round((correct / attempts) * 100)
            : 0;

        const text = document.createElement('p');

        text.textContent =
            `Module ${module.module_num}: ` +
            `${correct} / ${attempts} correct (${percentage}%)`;

        card.appendChild(text);
        moduleContainer.appendChild(card);
    });


    const questionContainer =
        document.getElementById('questionAnalytics');

    questionContainer.replaceChildren();

    data.questionBreakdown.forEach(question => {
        const card = document.createElement('div');
        card.className = 'card';

        const title = document.createElement('strong');

        title.textContent =
            `Question #${question.id} — ` +
            `${question.topic}`;

        const text = document.createElement('p');

        const attempts = Number(question.attempts);
        const correct = Number(question.correct);

        const percentage = attempts
            ? Math.round((correct / attempts) * 100)
            : 0;

        text.textContent =
            `Module ${question.module_num} | ` +
            `${question.question_type} | ` +
            `${correct}/${attempts} correct (${percentage}%)`;

        card.append(title, text);
        questionContainer.appendChild(card);
    });
}

// USER MANAGEMENT
async function loadUsers() {
    const container =
        document.getElementById('usersContainer');

    container.replaceChildren();

    const loading =
        document.createElement('p');

    loading.textContent =
        'Loading users...';

    container.appendChild(loading);

    try {
        const res =
            await fetch('/api/admin/users');

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            container.replaceChildren();

            const error =
                document.createElement('p');

            error.textContent =
                data.message ||
                data.error ||
                'Unable to load users.';

            container.appendChild(error);

            return;
        }

        container.replaceChildren();

        if (data.users.length === 0) {
            const empty =
                document.createElement('p');

            empty.textContent =
                'No users found.';

            container.appendChild(empty);

            return;
        }

        data.users.forEach(account => {
            const card =
                document.createElement('div');

            card.className = 'card';

            const title =
                document.createElement('h4');

            title.textContent =
                account.username;

            const details =
                document.createElement('p');

            const createdDate =
                account.created_at
                    ? new Date(account.created_at)
                        .toLocaleString()
                    : 'Unknown';

            details.textContent =
                `User ID: ${account.id} | ` +
                `Role: ${account.role} | ` +
                `Created: ${createdDate}`;

            const actions =
                document.createElement('div');

            actions.style.display = 'flex';
            actions.style.gap = '10px';
            actions.style.marginTop = '10px';

            if (account.id === user.id) {
                const current =
                    document.createElement('strong');

                current.textContent =
                    'Currently logged-in account';

                actions.appendChild(current);
            } else {
                const roleButton =
                    document.createElement('button');

                roleButton.textContent =
                    account.role === 'admin'
                        ? 'Make User'
                        : 'Make Admin';

                roleButton.onclick =
                    () => changeUserRole(
                        account.id,
                        account.role === 'admin'
                            ? 'user'
                            : 'admin'
                    );

                actions.appendChild(roleButton);

                const deleteButton =
                    document.createElement('button');

                deleteButton.textContent =
                    'Delete';

                deleteButton.className =
                    'danger-btn';

                deleteButton.onclick =
                    () => deleteUser(account.id);

                actions.appendChild(deleteButton);
            }

            card.append(
                title,
                details,
                actions
            );

            container.appendChild(card);
        });

    } catch (err) {
        console.error('Load users error:', err);

        container.replaceChildren();

        const error =
            document.createElement('p');

        error.textContent =
            'Unable to connect to the server.';

        container.appendChild(error);
    }
}

async function changeUserRole(userId, newRole) {
    const message =
        newRole === 'admin'
            ? 'Make this user an admin?'
            : 'Remove admin access from this user?';

    if (!confirm(message)) {
        return;
    }

    try {
        const res =
            await fetch(
                `/api/admin/users/${userId}/role`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        role: newRole
                    })
                }
            );

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            showAdminStatus(
                data.message ||
                data.error ||
                'Unable to update user role.',
                'error'
            );

            return;
        }

        showAdminStatus(
            'User role updated successfully.',
            'success'
        );

        loadUsers();

    } catch (err) {
        console.error(
            'Change user role error:',
            err
        );

        showAdminStatus(
            'User role updated successfully.',
            'success'
        );
    }
}

async function deleteUser(userId) {
    if (userId === user.id) {
        showAdminStatus(
            'You cannot delete your own account.',
            'error'
        );

        return;
    }

    if (!confirm(
        'Delete this user account? This cannot be undone.'
    )) {
        return;
    }

    try {
        const res =
            await fetch(
                `/api/admin/users/${userId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        adminId: user.id
                    })
                }
            );

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            showAdminStatus(
                data.message ||
                data.error ||
                'Unable to delete user.',
                'error'
            );

            return;
        }

        showAdminStatus(
            'User deleted successfully.',
            'success'
        );

        loadUsers();

    } catch (err) {
        console.error(
            'Delete user error:',
            err
        );

        showAdminStatus(
            'Unable to connect to the server.',
            'error'
        );
    }
}

let courseModalMode = null;
let courseModalCourseId = null;
let courseModalModuleId = null;
let courseModalParentCourseId = null;

let courseDeleteId = null;
let courseDeleteName = null;

async function loadCoursesManager() {
    const container =
        document.getElementById('coursesContainer');

    if (!container) {
        return;
    }

    container.innerHTML =
        '<p>Loading courses...</p>';

    try {
        const res =
            await fetch('/api/admin/courses');

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            throw new Error(
                data.error ||
                'Unable to load courses.'
            );
        }

        renderCoursesManager(data.courses);

    } catch (error) {
        console.error(
            'Load courses error:',
            error
        );

        container.innerHTML =
            '<p>Unable to load courses.</p>';
    }
}

function renderCoursesManager(courses) {
    const container =
        document.getElementById('coursesContainer');

    container.replaceChildren();

    if (!courses || courses.length === 0) {

        const empty =
            document.createElement('div');

        empty.className = 'card';

        empty.innerHTML = `
            <p>No courses have been created yet.</p>
        `;

        container.appendChild(empty);

        return;
    }

    courses.forEach(course => {

        const courseCard =
            document.createElement('div');

        courseCard.className =
            'course-manager-card';

        courseCard.innerHTML = `
            <div class="course-manager-header">

                <div class="course-manager-info">

                    <span
                        class="course-toggle"
                        id="course-toggle-${course.id}"
                    >
                        ▶
                    </span>

                    <span class="course-code">
                        ${escapeHtml(course.course_code)}
                    </span>

                    <span class="course-name">
                        — ${escapeHtml(course.course_name)}
                    </span>

                </div>

                <div class="course-manager-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-action="edit-course"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="danger-btn"
                        data-action="delete-course"
                    >
                        Delete
                    </button>

                </div>

            </div>

            <div
                id="course-modules-${course.id}"
                class="course-modules"
                style="display: none;"
            ></div>
        `;

        const header =
            courseCard.querySelector(
                '.course-manager-header'
            );

        const editButton =
            courseCard.querySelector(
                '[data-action="edit-course"]'
            );

        const deleteButton =
            courseCard.querySelector(
                '[data-action="delete-course"]'
            );

        editButton.addEventListener(
            'click',
            event => {
                event.stopPropagation();

                openEditCourseModal(
                    course.id,
                    course.course_code,
                    course.course_name
                );
            }
        );

        deleteButton.addEventListener(
            'click',
            event => {
                event.stopPropagation();

                openCourseDeletePasswordModal(
                    course.id,
                    `${course.course_code} — ${course.course_name}`
                );
            }
        );

        header.addEventListener(
            'click',
            () => toggleCourseModules(course.id)
        );

        container.appendChild(courseCard);
    });
}

async function toggleCourseModules(courseId) {

    const container =
        document.getElementById(
            `course-modules-${courseId}`
        );

    const toggle =
        document.getElementById(
            `course-toggle-${courseId}`
        );

    if (!container || !toggle) {
        return;
    }

    if (container.style.display === 'none') {

        container.style.display = 'block';
        toggle.textContent = '▼';

        await loadCourseModules(courseId);

    } else {

        container.style.display = 'none';
        toggle.textContent = '▶';
    }
}

async function loadCourseModules(courseId) {

    const container =
        document.getElementById(
            `course-modules-${courseId}`
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        '<p>Loading modules...</p>';

    try {

        const res =
            await fetch(
                `/api/admin/modules?courseId=${courseId}`
            );

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            throw new Error(
                data.error ||
                'Unable to load modules.'
            );
        }

        renderCourseModules(
            courseId,
            data.modules
        );

    } catch (error) {

        console.error(
            'Load modules error:',
            error
        );

        container.innerHTML = `
            <p>
                Unable to load modules:
                ${escapeHtml(error.message)}
            </p>
        `;
    }
}

function renderCourseModules(
    courseId,
    modules
) {

    const container =
        document.getElementById(
            `course-modules-${courseId}`
        );

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (!modules || modules.length === 0) {

        const empty =
            document.createElement('p');

        empty.className =
            'empty-modules';

        empty.textContent =
            'No modules have been added yet.';

        container.appendChild(empty);

    } else {

        modules.forEach(module => {

            const row =
                document.createElement('div');

            row.className =
                'module-manager-row';

            row.innerHTML = `
                <div class="module-manager-info">

                    <span class="module-number">
                        Module ${module.module_num}
                    </span>

                    <span class="module-name">
                        — ${escapeHtml(module.module_name)}
                    </span>

                </div>

                <div class="module-manager-actions">

                    <button
                        type="button"
                        class="secondary-btn"
                        data-action="edit-module"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="danger-btn"
                        data-action="delete-module"
                    >
                        Delete
                    </button>

                </div>
            `;

            row.querySelector(
                '[data-action="edit-module"]'
            ).addEventListener(
                'click',
                () => {
                    openEditModuleModal(
                        module.id,
                        module.module_num,
                        module.module_name,
                        courseId
                    );
                }
            );

            row.querySelector(
                '[data-action="delete-module"]'
            ).addEventListener(
                'click',
                () => {
                    deleteModule(
                        module.id,
                        module.module_name,
                        courseId
                    );
                }
            );

            container.appendChild(row);
        });
    }

    const addButton =
        document.createElement('button');

    addButton.type = 'button';
    addButton.className =
        'add-module-button';

    addButton.textContent =
        '+ Add Module';

    addButton.addEventListener(
        'click',
        () => openAddModuleModal(courseId)
    );

    container.appendChild(addButton);
}

/* =========================
COURSE / MODULE MODAL
========================= */

function openCourseModal() {

    courseModalMode = 'add-course';
    courseModalCourseId = null;
    courseModalModuleId = null;
    courseModalParentCourseId = null;

    document.getElementById(
        'courseModuleModalTitle'
    ).textContent = 'Add Course';

    document.getElementById(
        'courseModuleModalDescription'
    ).textContent =
        'Enter the information for the new course.';

    document.getElementById(
        'courseModuleModalFields'
    ).innerHTML = `
        <div class="form-group">

            <label for="modalCourseCode">
                Course Code
            </label>

            <input
                type="text"
                id="modalCourseCode"
                placeholder="Example: CS103"
            >

        </div>

        <div class="form-group">

            <label for="modalCourseName">
                Course Name
            </label>

            <input
                type="text"
                id="modalCourseName"
                placeholder="Example: Database Systems"
            >

        </div>
    `;

    showCourseModuleModal();
}

function openEditCourseModal(
    courseId,
    courseCode,
    courseName
) {

    courseModalMode = 'edit-course';
    courseModalCourseId = courseId;
    courseModalModuleId = null;
    courseModalParentCourseId = null;

    document.getElementById(
        'courseModuleModalTitle'
    ).textContent = 'Edit Course';

    document.getElementById(
        'courseModuleModalDescription'
    ).textContent =
        'Update the course information.';

    document.getElementById(
        'courseModuleModalFields'
    ).innerHTML = `
        <div class="form-group">

            <label for="modalCourseCode">
                Course Code
            </label>

            <input
                type="text"
                id="modalCourseCode"
                value="${escapeHtml(courseCode)}"
            >

        </div>

        <div class="form-group">

            <label for="modalCourseName">
                Course Name
            </label>

            <input
                type="text"
                id="modalCourseName"
                value="${escapeHtml(courseName)}"
            >

        </div>
    `;

    showCourseModuleModal();
}

function openAddModuleModal(courseId) {

    courseModalMode = 'add-module';
    courseModalCourseId = null;
    courseModalModuleId = null;
    courseModalParentCourseId = courseId;

    document.getElementById(
        'courseModuleModalTitle'
    ).textContent = 'Add Module';

    document.getElementById(
        'courseModuleModalDescription'
    ).textContent =
        'Enter the information for the new module.';

    document.getElementById(
        'courseModuleModalFields'
    ).innerHTML = `
        <div class="form-group">

            <label for="modalModuleNumber">
                Module Number
            </label>

            <input
                type="number"
                id="modalModuleNumber"
                min="1"
                placeholder="Example: 6"
            >

        </div>

        <div class="form-group">

            <label for="modalModuleName">
                Module Name
            </label>

            <input
                type="text"
                id="modalModuleName"
                placeholder="Example: Advanced Activities"
            >

        </div>
    `;

    showCourseModuleModal();
}

function openEditModuleModal(
    moduleId,
    moduleNum,
    moduleName,
    courseId
) {

    courseModalMode = 'edit-module';
    courseModalCourseId = null;
    courseModalModuleId = moduleId;
    courseModalParentCourseId = courseId;

    document.getElementById(
        'courseModuleModalTitle'
    ).textContent = 'Edit Module';

    document.getElementById(
        'courseModuleModalDescription'
    ).textContent =
        'Update the module information.';

    document.getElementById(
        'courseModuleModalFields'
    ).innerHTML = `
        <div class="form-group">

            <label for="modalModuleNumber">
                Module Number
            </label>

            <input
                type="number"
                id="modalModuleNumber"
                min="1"
                value="${moduleNum}"
            >

        </div>

        <div class="form-group">

            <label for="modalModuleName">
                Module Name
            </label>

            <input
                type="text"
                id="modalModuleName"
                value="${escapeHtml(moduleName)}"
            >

        </div>
    `;

    showCourseModuleModal();
}

function showCourseModuleModal() {

    document.getElementById(
        'courseModuleModalError'
    ).classList.remove('show');

    document.getElementById(
        'courseModuleModal'
    ).classList.add('show');
}

function closeCourseModuleModal() {

    document.getElementById(
        'courseModuleModal'
    ).classList.remove('show');

    courseModalMode = null;
    courseModalCourseId = null;
    courseModalModuleId = null;
    courseModalParentCourseId = null;
}

async function saveCourseModuleModal() {

    const errorElement =
        document.getElementById(
            'courseModuleModalError'
        );

    errorElement.classList.remove('show');

    try {

        if (
            courseModalMode === 'add-course' ||
            courseModalMode === 'edit-course'
        ) {

            const courseCode =
                document.getElementById(
                    'modalCourseCode'
                ).value.trim();

            const courseName =
                document.getElementById(
                    'modalCourseName'
                ).value.trim();

            if (!courseCode || !courseName) {
                throw new Error(
                    'Course code and course name are required.'
                );
            }

            const isEdit =
                courseModalMode === 'edit-course';

            const url =
                isEdit
                    ? `/api/admin/courses/${courseModalCourseId}`
                    : '/api/admin/courses';

            const method =
                isEdit
                    ? 'PUT'
                    : 'POST';

            const res =
                await fetch(
                    url,
                    {
                        method,
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body: JSON.stringify({
                            course_code: courseCode,
                            course_name: courseName
                        })
                    }
                );

            const data =
                await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.error ||
                    'Unable to save course.'
                );
            }

        } else {

            const moduleNum =
                Number(
                    document.getElementById(
                        'modalModuleNumber'
                    ).value
                );

            const moduleName =
                document.getElementById(
                    'modalModuleName'
                ).value.trim();

            if (!moduleNum || !moduleName) {
                throw new Error(
                    'Module number and module name are required.'
                );
            }

            const isEdit =
                courseModalMode === 'edit-module';

            const url =
                isEdit
                    ? `/api/admin/modules/${courseModalModuleId}`
                    : '/api/admin/modules';

            const method =
                isEdit
                    ? 'PUT'
                    : 'POST';

            const body =
                isEdit
                    ? {
                        module_num: moduleNum,
                        module_name: moduleName
                    }
                    : {
                        course_id:
                            courseModalParentCourseId,
                        module_num: moduleNum,
                        module_name: moduleName
                    };

            const res =
                await fetch(
                    url,
                    {
                        method,
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body: JSON.stringify(body)
                    }
                );

            const data =
                await res.json();

            if (!res.ok || !data.success) {
                throw new Error(
                    data.error ||
                    'Unable to save module.'
                );
            }
        }

        closeCourseModuleModal();

        await loadCoursesManager();

    } catch (error) {

        console.error(
            'Save course/module error:',
            error
        );

        errorElement.textContent =
            error.message;

        errorElement.classList.add('show');
    }
}

async function deleteModule(
    moduleId,
    moduleName,
    courseId
) {
    const confirmed =
        await openSimpleDeleteModal(
            `Delete module "${moduleName}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const res =
            await fetch(
                `/api/admin/modules/${moduleId}`,
                {
                    method: 'DELETE'
                }
            );

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            throw new Error(
                data.error ||
                'Unable to delete module.'
            );
        }

        await loadCourseModules(courseId);

    } catch (error) {

        console.error(
            'Delete module error:',
            error
        );

        showCourseStatus(
            error.message,
            'error'
        );
    }
}

function openCourseDeletePasswordModal(
    courseId,
    courseName
) {
    courseDeleteId = courseId;
    courseDeleteName = courseName;

    document.getElementById(
        'deleteCoursePassword'
    ).value = '';

    document.getElementById(
        'courseDeletePasswordError'
    ).classList.remove('show');

    document.getElementById(
        'courseDeletePasswordModal'
    ).classList.add('show');

    setTimeout(() => {
        document.getElementById(
            'deleteCoursePassword'
        ).focus();
    }, 50);
}

function closeCourseDeletePasswordModal() {

    document.getElementById(
        'courseDeletePasswordModal'
    ).classList.remove('show');

    document.getElementById(
        'deleteCoursePassword'
    ).value = '';

    document.getElementById(
        'courseDeletePasswordError'
    ).classList.remove('show');
}

async function verifyCourseDeletePassword() {

    const password =
        document.getElementById(
            'deleteCoursePassword'
        ).value;

    const errorElement =
        document.getElementById(
            'courseDeletePasswordError'
        );

    errorElement.classList.remove('show');

    if (!password) {

        errorElement.textContent =
            'Please enter your administrator password.';

        errorElement.classList.add('show');

        return;
    }

    try {

        const res =
            await fetch(
                `/api/admin/courses/${courseDeleteId}/verify-delete`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        adminId: user.id,
                        password
                    })
                }
            );

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            throw new Error(
                data.error ||
                'Administrator verification failed.'
            );
        }

        closeCourseDeletePasswordModal();

        document.getElementById(
            'courseDeleteConfirmText'
        ).textContent =
            `You are about to permanently delete "${courseDeleteName}". ` +
            `This may remove its modules, topics, questions, and related exam data. ` +
            `Are you sure?`;

        document.getElementById(
            'courseDeleteConfirmError'
        ).classList.remove('show');

        document.getElementById(
            'courseDeleteConfirmModal'
        ).classList.add('show');

    } catch (error) {

        console.error(
            'Course deletion verification error:',
            error
        );

        errorElement.textContent =
            error.message;

        errorElement.classList.add('show');
    }
}

function closeCourseDeleteConfirmModal() {

    document.getElementById(
        'courseDeleteConfirmModal'
    ).classList.remove('show');

    courseDeleteId = null;
    courseDeleteName = null;
}

async function confirmCourseDeletion() {

    const errorElement =
        document.getElementById(
            'courseDeleteConfirmError'
        );

    errorElement.classList.remove('show');

    try {

        const res =
            await fetch(
                `/api/admin/courses/${courseDeleteId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        adminId: user.id
                    })
                }
            );

        const data =
            await res.json();

        if (!res.ok || !data.success) {
            throw new Error(
                data.error ||
                'Unable to delete course.'
            );
        }

        closeCourseDeleteConfirmModal();

        showCourseStatus(
            'Course deleted successfully.',
            'success'
        );

        await loadCoursesManager();

    } catch (error) {

        console.error(
            'Delete course error:',
            error
        );

        errorElement.textContent =
            error.message;

        errorElement.classList.add('show');
    }
}