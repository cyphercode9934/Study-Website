const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'index.html';

function logout() {
    const confirmed = confirm( 'Are you sure you want to log out?' );

    if (!confirmed) { return; }

    localStorage.clear();
    window.location.href = 'index.html';
}

let currentSessionId = null;
let activeQuestions = [];
let userAnswers = {};
let checkedQuestions = {};
let currentQuestionIdx = 0;

const COLORS = ['#1f6feb', '#238636', '#da3633', '#8957e5', '#d29922'];

document.addEventListener('DOMContentLoaded', () => {
    fetchUserCourses();
    setupCheckboxGuards();
});

function showExamStatus(message, type = 'info') {
    const element =
        document.getElementById('examStatus');

    if (!element) return;

    element.textContent = message;

    element.className =
        `status-message ${type} show`;
}

async function fetchUserCourses() {
    const res =
        await fetch('/api/admin/courses');

    const data =
        await res.json();

    if (data.success) {
        const courseSelect =
            document.getElementById('user_course_id');

        courseSelect.innerHTML =
            data.courses
                .map(course => `
                    <option value="${course.id}">
                        ${course.course_code} - ${course.course_name}
                    </option>
                `)
                .join('');

        if (data.courses.length > 0) {
            await fetchCourseModules(
                data.courses[0].id
            );
        }

        courseSelect.addEventListener(
            'change',
            () => {
                fetchCourseModules(
                    courseSelect.value
                );
            }
        );
    }
}

async function fetchCourseModules(courseId) {
    const moduleContainer =
        document.getElementById('moduleCheckboxes');

    const modAll =
        document.getElementById('mod_all');

    moduleContainer.innerHTML =
        'Loading modules...';

    modAll.checked = true;

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

        moduleContainer.innerHTML = '';

        if (!data.modules || data.modules.length === 0) {
            moduleContainer.innerHTML =
                '<p>No modules available for this course.</p>';

            modAll.checked = false;

            return;
        }

        data.modules.forEach(module => {
            const label =
                document.createElement('label');

            label.className =
                'checkbox-label';

            label.innerHTML = `
                <input
                    type="checkbox"
                    name="module_cb"
                    value="${module.module_num}"
                    checked
                >
                Module ${module.module_num}
            `;

            moduleContainer.appendChild(label);
        });

        setupModuleCheckboxes();

    } catch (error) {
        console.error(
            'Load course modules error:',
            error
        );

        moduleContainer.innerHTML =
            '<p>Unable to load modules.</p>';

        modAll.checked = false;
    }
}

function setupCheckboxGuards() {
    const typeAll =
        document.getElementById('type_all');

    const typeCbs =
        document.querySelectorAll(
            'input[name="type_cb"]'
        );

    typeAll.addEventListener(
        'change',
        () => {
            typeCbs.forEach(
                cb => cb.checked = typeAll.checked
            );

            validateSelection(
                'type_cb',
                typeAll
            );
        }
    );

    typeCbs.forEach(cb => {
        cb.addEventListener(
            'change',
            () => {
                typeAll.checked =
                    Array.from(typeCbs)
                        .every(cb => cb.checked);

                validateSelection(
                    'type_cb',
                    typeAll
                );
            }
        );
    });
}

function setupModuleCheckboxes() {
    const modAll =
        document.getElementById('mod_all');

    const modCbs =
        document.querySelectorAll(
            'input[name="module_cb"]'
        );

    modAll.onchange = () => {
        modCbs.forEach(
            cb => cb.checked = modAll.checked
        );

        validateSelection(
            'module_cb',
            modAll
        );
    };

    modCbs.forEach(cb => {
        cb.onchange = () => {
            modAll.checked =
                Array.from(modCbs)
                    .every(cb => cb.checked);

            validateSelection(
                'module_cb',
                modAll
            );
        };
    });
}

function validateSelection(groupName, allCheckbox) {
    const checked = document.querySelectorAll(`input[name="${groupName}"]:checked`);
    if (checked.length === 0) {
        allCheckbox.checked = true;
        document.querySelectorAll(`input[name="${groupName}"]`).forEach(cb => cb.checked = true);
    }
}

function switchTab(tab) {
    document.getElementById('examTab').classList.toggle('active', tab === 'exam');
    document.getElementById('profileTab').classList.toggle('active', tab === 'profile');
    document.getElementById('examView').style.display = tab === 'exam' ? 'block' : 'none';
    document.getElementById('profileView').style.display = tab === 'profile' ? 'block' : 'none';

    if (tab === 'profile') loadUserProfile();
}

async function startExam() {
    const courseId = document.getElementById('user_course_id').value;
    const selectedModules = Array.from(document.querySelectorAll('input[name="module_cb"]:checked')).map(cb => cb.value);
    const selectedTypes = Array.from(document.querySelectorAll('input[name="type_cb"]:checked')).map(cb => cb.value);
    const limit = document.getElementById('limit').value;

    if (selectedModules.length === 0 || selectedTypes.length === 0) {
        showExamStatus(
            'Please select at least one module and one question type.',
            'error'
        );

        return;
    }

    const res = await fetch('/api/user/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId, modules: selectedModules, questionTypes: selectedTypes, limit })
    });

    const data = await res.json();
    if (data.success && data.questions.length) {
        currentSessionId = data.sessionId;

        activeQuestions = data.questions;
        userAnswers = {};
        checkedQuestions = {};
        currentQuestionIdx = 0;

        document
            .getElementById('singleQuestionContainer')
            .replaceChildren();

        document.getElementById('portalTabs').style.display = 'none';
        document.getElementById('setupSection').style.display = 'none';
        document.getElementById('examSection').style.display = 'block';

        renderQuestionNav();
        displayQuestion(0);
    } else {
        showExamStatus(
            'No questions match your chosen configuration.',
            'error'
        );
    }
}

function renderQuestionNav() {
    document.getElementById('questionNavGrid').innerHTML = activeQuestions.map((q, idx) => `
        <div class="nav-grid-btn ${idx === currentQuestionIdx ? 'active' : ''} ${userAnswers[q.id] ? 'answered' : ''}" 
             onclick="displayQuestion(${idx})">${idx + 1}</div>
    `).join('');
}

function displayQuestion(idx) {
    if (
        idx < 0 ||
        idx >= activeQuestions.length
    ) { return; }

    const container =
        document.getElementById('singleQuestionContainer');

    if (container.children.length > 0) {
        saveCurrentAnswer();
    }

    currentQuestionIdx = idx;

    const q = activeQuestions[idx];
    const isChecked = checkedQuestions[q.id];

    if (idx < 0 || idx >= activeQuestions.length) {
        return;
    }

    let optionsHtml = '';
    if (q.question_type === 'multiple_choice') {
        const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        optionsHtml = opts.map(opt => `
            <label class="checkbox-label" style="margin-bottom: 8px;">
                <input type="radio" name="active_q" value="${opt}" 
                       ${userAnswers[q.id] === opt ? 'checked' : ''} 
                       ${isChecked ? 'disabled' : ''}
                       onchange="userAnswers[${q.id}]=this.value; renderQuestionNav();"> ${opt}
            </label>
        `).join('');
    } else {
        optionsHtml = `
            <input type="text" id="active_input" value="${userAnswers[q.id] || ''}" 
                   ${isChecked ? 'disabled' : ''} 
                   placeholder="Type exact answer..." 
                   oninput="userAnswers[${q.id}]=this.value; renderQuestionNav();">
        `;
    }

    document.getElementById('singleQuestionContainer').innerHTML = `
        <div class="card">
            <h4>Question ${idx + 1} of ${activeQuestions.length}</h4>
            <p>${q.question_text}</p>
            ${q.code_snippet ? `<div class="code-block">${q.code_snippet}</div>` : ''}
            ${optionsHtml}
            <div id="checkFeedback"></div>
        </div>
    `;

    document.getElementById('prevBtn').disabled = idx === 0;
    document.getElementById('nextBtn').disabled = idx === activeQuestions.length - 1;
    document.getElementById('checkAnswerBtn').disabled = !!isChecked;

    if (isChecked) showQuestionFeedback(q);
    renderQuestionNav();
}

function saveCurrentAnswer() {
    if (!activeQuestions.length) return;
    const q = activeQuestions[currentQuestionIdx];
    if (q.question_type === 'multiple_choice') {
        const checked = document.querySelector('input[name="active_q"]:checked');
        if (checked) userAnswers[q.id] = checked.value;
    } else {
        const input = document.getElementById('active_input');
        if (input) userAnswers[q.id] = input.value;
    }
}

function normalizeAnswer(value) {
    return String(value ?? '').toLowerCase();
}

function answersMatch(userAnswer, correctAnswer) {
    return normalizeAnswer(userAnswer) ===
           normalizeAnswer(correctAnswer);
}

async function checkCurrentAnswer() {
    saveCurrentAnswer();

    const q = activeQuestions[currentQuestionIdx];

    const answer =
        userAnswers[q.id] || '';

    const isCorrect =
        answersMatch(
            answer,
            q.correct_answer
        );

    checkedQuestions[q.id] = true;

    const res = await fetch(
        '/api/user/check-answer',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                sessionId: currentSessionId,
                questionId: q.id,
                selectedAnswer: answer,
                isCorrect
            })
        }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
        checkedQuestions[q.id] = false;

        showExamStatus(
            data.message ||
            data.error ||
            'Unable to record answer check.',
            'error'
        );

        return;
    }
    displayQuestion(currentQuestionIdx);
}

function showQuestionFeedback(q) {
    const ans = userAnswers[q.id] || '';
    const isCorrect = ans.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
    
    document.getElementById('checkFeedback').innerHTML = isCorrect ? 
        `<p style="color: #2ea043; font-weight: bold; margin-top: 10px;">✔ Correct!</p>` : 
        `<div class="explanation">
            <p style="color: #f85149; font-weight: bold;">✘ Incorrect</p>
            <p><strong>Correct Answer:</strong> ${q.correct_answer}</p>
            <p><strong>Explanation:</strong> ${q.explanation}</p>
         </div>`;
}

function navigateQuestion(direction) {
    displayQuestion(currentQuestionIdx + direction);
}

async function submitExam() {
    saveCurrentAnswer();

    const answers = activeQuestions.map(q => {
        const answer =
            userAnswers[q.id] || '';

        const isCorrect =
            answersMatch(
                answer,
                q.correct_answer
            );

        return {
            questionId: q.id,
            selectedAnswer: answer,
            isCorrect
        };
    });

    const res = await fetch(
        '/api/user/submit-exam',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                sessionId: currentSessionId,
                answers
            })
        }
    );

    const data = await res.json();

    if (!res.ok || !data.success) {
        alert(
            data.message ||
            data.error ||
            'Unable to submit exam.'
        );

        return;
    }

    const selectedModules =
        Array.from(
            new Set(
                activeQuestions.map(
                    q => q.module_num
                )
            )
        );

    renderExamSummary(selectedModules);
}

function renderExamSummary(selectedModules) {
    document.getElementById('examSection').style.display = 'none';
    document.getElementById('summarySection').style.display = 'block';

    const chartsContainer =
        document.getElementById('summaryChartsContainer');

    chartsContainer.replaceChildren();

    if (selectedModules.length === 1) {
        let correctCount = 0;

        activeQuestions.forEach(q => {
            const answer =
                userAnswers[q.id] || '';

            if (answersMatch(answer, q.correct_answer)) {
                correctCount++;
            }
        });

        const wrongCount =
            activeQuestions.length - correctCount;

        chartsContainer.appendChild(
            renderSingleDonut(
                'Exam Accuracy Distribution',
                [
                    {
                        label: 'Correct',
                        count: correctCount,
                        color: '#238636'
                    },
                    {
                        label: 'Wrong',
                        count: wrongCount,
                        color: '#da3633'
                    }
                ]
            )
        );

    } else {
        const correctModuleCounts = {};
        const wrongModuleCounts = {};

        activeQuestions.forEach(q => {
            const answer =
                userAnswers[q.id] || '';

            const isCorrect =
                answersMatch(
                    answer,
                    q.correct_answer
                );

            const modKey =
                `Module ${q.module_num}`;

            if (isCorrect) {
                correctModuleCounts[modKey] =
                    (correctModuleCounts[modKey] || 0) + 1;
            } else {
                wrongModuleCounts[modKey] =
                    (wrongModuleCounts[modKey] || 0) + 1;
            }
        });

        const correctData =
            Object.keys(correctModuleCounts).map(
                (mod, i) => ({
                    label: mod,
                    count: correctModuleCounts[mod],
                    color: COLORS[i % COLORS.length]
                })
            );

        const wrongData =
            Object.keys(wrongModuleCounts).map(
                (mod, i) => ({
                    label: mod,
                    count: wrongModuleCounts[mod],
                    color: COLORS[i % COLORS.length]
                })
            );

        if (correctData.length > 0) {
            chartsContainer.appendChild(
                renderSingleDonut(
                    'Correct Answers by Module',
                    correctData
                )
            );
        }

        if (wrongData.length > 0) {
            chartsContainer.appendChild(
                renderSingleDonut(
                    'Wrong Answers by Module',
                    wrongData
                )
            );
        }
    }

    const reviewList =
        document.getElementById('canvasReviewList');

    reviewList.replaceChildren();

    activeQuestions.forEach((q, idx) => {
        reviewList.appendChild(
            createQuestionReview(q, idx)
        );
    });
}

function renderSingleDonut(title, data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';

    const heading = document.createElement('h4');
    heading.textContent = title;

    const chartContainer = document.createElement('div');

    chartContainer.style.position = 'relative';
    chartContainer.style.height = '260px';
    chartContainer.style.width = '100%';

    const canvas = document.createElement('canvas');

    chartContainer.appendChild(canvas);

    const legend = document.createElement('div');

    legend.style.marginTop = '15px';

    data.forEach(item => {
        const row = document.createElement('div');

        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '6px';

        const indicator = document.createElement('span');

        indicator.style.width = '12px';
        indicator.style.height = '12px';
        indicator.style.borderRadius = '50%';
        indicator.style.backgroundColor = item.color;
        indicator.style.display = 'inline-block';
        indicator.style.marginRight = '8px';

        const label = document.createElement('span');

        label.textContent =
            `${item.label}: ${item.count}`;

        row.append(
            indicator,
            label
        );

        legend.appendChild(row);
    });

    wrapper.append(
        heading,
        chartContainer,
        legend
    );

    const labels =
        data.map(item => item.label);

    const values =
        data.map(item => item.count);

    const colors =
        data.map(item => item.color);

    new Chart(canvas, {
        type: 'doughnut',

        data: {
            labels: labels,

            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 0
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    return wrapper;
}

function renderPerformanceChart(examPerformance) {
    const canvas =
        document.getElementById('performanceChart');

    if (!canvas) {
        return;
    }

    const existingChart =
        Chart.getChart(canvas);

    if (existingChart) {
        existingChart.destroy();
    }

    const labels = examPerformance.map(
        (_, index) => index + 1
    );

    const percentages = examPerformance.map(
        exam => {
            const total =
                Number(exam.total_questions) || 0;

            const correct =
                Number(exam.correct_answers) || 0;

            if (total === 0) {
                return 0;
            }

            return Math.round(
                (correct / total) * 100
            );
        }
    );

    const rootStyles =
        getComputedStyle(
            document.documentElement
        );

    const primaryBlue =
        rootStyles
            .getPropertyValue('--blue-primary')
            .trim();

    const panelBorder =
        rootStyles
            .getPropertyValue('--panel-border')
            .trim();

    const textMuted =
        rootStyles
            .getPropertyValue('--text-muted')
            .trim();

    new Chart(canvas, {
        type: 'line',

        data: {
            labels: labels,

            datasets: [
                {
                    label: 'Performance',

                    data: percentages,

                    borderColor:
                        primaryBlue,

                    backgroundColor:
                        'rgba(31, 111, 235, 0.15)',

                    borderWidth: 2,

                    pointRadius: 5,

                    pointHoverRadius: 7,

                    tension: 0.25,

                    fill: true
                }
            ]
        },

        options: {
            responsive: true,

            maintainAspectRatio: false,

            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Exam Iteration',
                        color: textMuted
                    },

                    ticks: {
                        precision: 0,
                        color: textMuted
                    },

                    grid: {
                        color: panelBorder
                    }
                },

                y: {
                    min: 0,

                    max: 100,

                    ticks: {
                        stepSize: 20,

                        color: textMuted,

                        callback: function(value) {
                            return value + '%';
                        }
                    },

                    title: {
                        display: true,
                        text: 'Correct Answer Percentage',
                        color: textMuted
                    },

                    grid: {
                        color: panelBorder
                    }
                }
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return (
                                context.parsed.y +
                                '% correct'
                            );
                        }
                    }
                }
            }
        }
    });
}

function createQuestionReview(q, idx) {
    const answer =
        userAnswers[q.id] || '';
    const isCorrect =
        answersMatch(
            answer,
            q.correct_answer
        );

    const card = document.createElement('div');
    card.className = 'card';
    card.style.borderLeft =
        `4px solid ${
            isCorrect
                ? '#238636'
                : '#da3633'
        }`;

    const heading =
        document.createElement('h4');
    heading.textContent =
        `Question ${idx + 1} [Module ${q.module_num}]`;

    const question =
        document.createElement('p');
    question.textContent =
        q.question_text;

    card.append(
        heading,
        question
    );

    if (q.code_snippet) {
        const code =
            document.createElement('div');
        code.className = 'code-block';
        code.textContent =
            q.code_snippet;
        card.appendChild(code);
    }

    if (q.question_type === 'multiple_choice') {
        const options =
            typeof q.options === 'string'
                ? JSON.parse(q.options)
                : q.options || [];

        const optionsContainer =
            document.createElement('div');

        options.forEach(option => {
            const label =
                document.createElement('div');

            label.style.marginBottom = '8px';

            const isSelected =
                option === answer;

            const isCorrectOption =
                option === q.correct_answer;

            const marker =
                document.createElement('span');

            if (isSelected && isCorrectOption) {
                marker.textContent = '✓ ';
            } else if (isSelected) {
                marker.textContent = '● ';
            } else if (isCorrectOption) {
                marker.textContent = '✓ ';
            } else {
                marker.textContent = '○ ';
            }

            const text =
                document.createElement('span');

            text.textContent = option;

            if (isSelected && isCorrectOption) {
                text.textContent += ' (Your Answer)';
            } else if (isSelected) {
                text.textContent += ' (Your Answer)';
            }

            if (isCorrectOption && !isSelected) {
                text.textContent += ' (Correct Answer)';
            }

            label.append(
                marker,
                text
            );

            optionsContainer.appendChild(label);
        });

        card.appendChild(optionsContainer);
    }

    const yourAnswer =
        document.createElement('p');
    const yourLabel =
        document.createElement('strong');
    yourLabel.textContent =
        'Your Answer: ';
    const yourValue =
        document.createElement('span');
    yourValue.textContent =
        answer || 'None';
    yourValue.style.color =
        isCorrect
            ? '#238636'
            : '#da3633';
    yourAnswer.append(
        yourLabel,
        yourValue
    );

    const correctAnswer =
        document.createElement('p');
    const correctLabel =
        document.createElement('strong');
    correctLabel.textContent =
        'Correct Answer: ';
    const correctValue =
        document.createElement('span');
    correctValue.textContent =
        q.correct_answer;
    correctAnswer.append(
        correctLabel,
        correctValue
    );

    const explanation =
        document.createElement('div');
    explanation.className =
        'explanation';
    const explanationLabel =
        document.createElement('strong');
    explanationLabel.textContent =
        'Explanation: ';
    const explanationText =
        document.createElement('span');
    explanationText.textContent =
        q.explanation;

    explanation.append(
        explanationLabel,
        explanationText
    );

    card.append(
        yourAnswer,
        correctAnswer,
        explanation
    );

    return card;
}

function resetExamPortal() {
    activeQuestions = [];
    userAnswers = {};
    checkedQuestions = {};
    currentQuestionIdx = 0;

    document
        .getElementById('singleQuestionContainer')
        .replaceChildren();

    document
        .getElementById('questionNavGrid')
        .replaceChildren();

    document.getElementById('portalTabs').style.display = 'flex';
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('setupSection').style.display = 'block';
}

// replace donut with line graphs for records of performance over time (use percentage so number of questions does not matter)
async function loadUserProfile() {
    try {
        const res = await fetch(
            `/api/user/profile-stats/${user.id}`
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
            return;
        }

        const stats = data.stats;

        const questionBankTotal =
            Number(stats.questionBankTotal) || 0;

        const answeredQuestionCount =
            Number(stats.answeredQuestionCount) || 0;

        const progressContainer =
            document.getElementById(
                'questionBankProgress'
            );

        if (progressContainer) {
            progressContainer.innerHTML = `
                <h4>Question Bank Progress</h4>

                <div class="question-count-value">
                    ${answeredQuestionCount}/${questionBankTotal}
                </div>

                <p>Questions answered</p>
            `;
        }

        renderPerformanceChart(
            stats.examPerformance || []
        );

        const moduleList =
            document.getElementById(
                'moduleBreakdownList'
            );

        if (!moduleList) {
            return;
        }

        moduleList.innerHTML =
            stats.moduleBreakdown
                .map(m => {
                    const attempts =
                        Number(m.attempts) || 0;

                    const correct =
                        Number(m.correct) || 0;

                    const percentage =
                        attempts > 0
                            ? Math.round(
                                (correct / attempts) * 100
                            )
                            : 0;

                    return `
                        <div
                            class="card"
                            style="
                                display:flex;
                                justify-content:space-between;
                                align-items:center;
                            "
                        >
                            <strong>
                                Module ${m.module_num}
                            </strong>

                            <span>
                                ${correct} / ${attempts}
                                Correct (${percentage}%)
                            </span>
                        </div>
                    `;
                })
                .join('') ||
            '<p>No exam data recorded yet.</p>';

    } catch (error) {
        console.error(
            'Load profile error:',
            error
        );
    }
}