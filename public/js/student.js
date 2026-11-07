
const studentToken = localStorage.getItem('authToken');
const studentRole = localStorage.getItem('userRole');

const studentNameElement = document.getElementById('studentName');
const welcomeNameElement = document.getElementById('welcomeName');
const courseListElement = document.getElementById('courseList');
const courseCountElement = document.getElementById('courseCount');
const feedbackCountElement = document.getElementById('feedbackCount');
const pageMessageElement = document.getElementById('pageMessage');
const availableCourseListElement = document.getElementById('availableCourseList');
const logoutButton = document.getElementById('logoutButton');
const refreshButton = document.getElementById('refreshButton');

const courseMessages = new Map();
let submittedCourseIds = new Set();
let monthlyFeedbackStatus = new Map();
let currentDate = '';

function showDashboardMessage(message, type = 'error') {
    if (!pageMessageElement) return;

    pageMessageElement.textContent = message;
    pageMessageElement.className = `dashboard-message show ${type}`;
}

function hideDashboardMessage() {
    if (!pageMessageElement) return;

    pageMessageElement.textContent = '';
    pageMessageElement.className = 'dashboard-message';
}

function showCourseMessage(element, message, type = 'error') {
    if (!element) return;

    element.textContent = message;
    element.className = `course-action-message show ${type}`;
}

function hideCourseMessage(element) {
    if (!element) return;

    element.textContent = '';
    element.className = 'course-action-message';
}

function saveCourseMessage(courseId, message, type = 'error') {
    courseMessages.set(Number(courseId), { message, type });
}

function displaySavedCourseMessage(courseId, messageElement) {
    const savedMessage = courseMessages.get(Number(courseId));

    if (savedMessage) {
        showCourseMessage(
            messageElement,
            savedMessage.message,
            savedMessage.type
        );
    }
}

function createElement(tag, className = '', text = '') {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined && text !== null) {
        element.textContent = text;
    }

    return element;
}

function formatDate(dateString) {
    if (!dateString) return 'Not available';

    const parts = dateString.split('-').map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return dateString;
    }

    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function createDateInformation(label, dateString) {
    const paragraph = createElement('p', 'feedback-date');

    const labelElement = createElement('strong', '', `${label}: `);
    const dateElement = createElement(
        'span',
        '',
        formatDate(dateString)
    );

    paragraph.append(labelElement, dateElement);

    return paragraph;
}

function createFeedbackConfirmation(alreadySubmitted = false, details = null) {
    const confirmation = createElement('div', 'feedback-completed');

    const successIcon = createElement(
        'div',
        'feedback-completed-icon',
        '✓'
    );

    const successTitle = createElement(
        'h3',
        '',
        alreadySubmitted
            ? 'Feedback Already Submitted This Month'
            : 'Feedback Successfully Submitted'
    );

    const successText = createElement(
        'p',
        '',
        alreadySubmitted
            ? 'You have already submitted feedback for this course during the current month.'
            : 'Thank you for sharing your learning experience. Your anonymous feedback has been recorded successfully.'
    );

    const successStatus = createElement(
        'span',
        'feedback-completed-status',
        alreadySubmitted
            ? 'Monthly Submission Already Recorded'
            : 'Monthly Submission Completed'
    );

    confirmation.append(
        successIcon,
        successTitle,
        successText
    );

    if (details) {
        confirmation.append(
            createDateInformation(
                'Current date',
                details.currentDate || currentDate
            ),
            createDateInformation(
                'Feedback submitted on',
                details.submittedOn
            ),
            createDateInformation(
                'Next eligible submission date',
                details.nextEligibleDate
            )
        );
    }

    const nextMonthText = createElement(
        'p',
        'feedback-next-month-message',
        'You can submit feedback for this course again when the next calendar month begins.'
    );

    confirmation.append(successStatus, nextMonthText);

    if (alreadySubmitted) {
        confirmation.classList.add('feedback-already-submitted');
    }

    return confirmation;
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');

    window.location.replace('/login.html');
}

async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        logout();
        throw new Error('Your session has expired. Please log in again.');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error('The server returned an invalid response.');
    }

    if (response.status === 401) {
        logout();
        throw new Error('Your session has expired. Please log in again.');
    }

    if (!response.ok) {
        const error = new Error(
            data.message || `Request failed with status ${response.status}.`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}

async function loadFeedbackCount() {
    if (!feedbackCountElement) return;

    try {
        const result = await apiRequest('/api/feedback/my-count');
        const count = Number(result.data?.feedbackCount);

        if (!Number.isFinite(count) || count < 0) {
            throw new Error('Invalid feedback count received from server.');
        }

        feedbackCountElement.textContent = count;
    } catch (error) {
        feedbackCountElement.textContent = '—';

        if (error.status === 401) return;

        showDashboardMessage(
            'Unable to load your feedback submission count. Please refresh the dashboard.',
            'error'
        );
    }
}

async function loadMonthlyFeedbackStatus() {
    const result = await apiRequest('/api/feedback/my-status');

    const courseIds = result.data?.submittedCourseIds;
    const submissions = result.data?.submissions;

    if (!Array.isArray(courseIds) || !Array.isArray(submissions)) {
        throw new Error(
            'The server returned an invalid monthly feedback status.'
        );
    }

    currentDate = result.data?.currentDate || '';

    submittedCourseIds = new Set(
        courseIds.map(Number)
    );

    monthlyFeedbackStatus = new Map(
        submissions.map((submission) => [
            Number(submission.courseId),
            {
                currentDate,
                submittedOn: submission.submittedOn,
                nextEligibleDate: submission.nextEligibleDate
            }
        ])
    );
}

function renderAvailableCourses(courses) {
    if (!availableCourseListElement) return;

    availableCourseListElement.replaceChildren();

    if (courses.length === 0) {
        availableCourseListElement.appendChild(
            createElement(
                'p',
                'empty-state',
                'You are already enrolled in all available courses.'
            )
        );

        return;
    }

    courses.forEach((course) => {
        const card = createElement('article', 'course-card');

        const code = createElement(
            'p',
            'course-code',
            course.course_code || `COURSE ${course.course_id}`
        );

        const title = createElement(
            'h3',
            '',
            course.course_title || 'Course'
        );

        const description = createElement(
            'p',
            'course-description',
            course.course_description || 'No description available.'
        );

        const enrollButton = createElement(
            'button',
            'feedback-submit',
            'Enroll in This Course'
        );

        enrollButton.type = 'button';

        const statusMessage = createElement(
            'p',
            'course-action-message'
        );

        enrollButton.addEventListener('click', async () => {
            const courseId = Number(course.course_id);

            if (!courseId) {
                showCourseMessage(
                    statusMessage,
                    'Invalid course information.',
                    'error'
                );

                return;
            }

            hideCourseMessage(statusMessage);

            enrollButton.disabled = true;
            enrollButton.textContent = 'Enrolling...';

            try {
                await apiRequest('/api/enrollments/self', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ courseId })
                });

                saveCourseMessage(
                    courseId,
                    `You have successfully enrolled in ${course.course_title || 'this course'}.`,
                    'success'
                );

                await loadCourses();

            } catch (error) {
                showCourseMessage(
                    statusMessage,
                    error.message,
                    'error'
                );

                enrollButton.disabled = false;
                enrollButton.textContent = 'Enroll in This Course';
            }
        });

        card.append(
            code,
            title,
            description,
            enrollButton,
            statusMessage
        );

        displaySavedCourseMessage(course.course_id, statusMessage);

        availableCourseListElement.appendChild(card);
    });
}

function createFeedbackForm(course) {
    const form = createElement('form', 'feedback-form');

    const ratingLabel = createElement(
        'label',
        '',
        'Course Rating'
    );

    const ratingSelect = createElement('select');

    ratingSelect.required = true;
    ratingSelect.name = 'rating';

    const ratingPlaceholder = createElement(
        'option',
        '',
        'Choose a rating'
    );

    ratingPlaceholder.value = '';
    ratingPlaceholder.disabled = true;
    ratingPlaceholder.selected = true;

    ratingSelect.appendChild(ratingPlaceholder);

    [
        ['5', '5 - Excellent'],
        ['4', '4 - Very Good'],
        ['3', '3 - Good'],
        ['2', '2 - Fair'],
        ['1', '1 - Poor']
    ].forEach(([value, label]) => {
        const option = createElement('option', '', label);

        option.value = value;
        ratingSelect.appendChild(option);
    });

    const commentLabel = createElement(
        'label',
        '',
        'Your Comments'
    );

    const commentInput = createElement('textarea');

    commentInput.name = 'comment';
    commentInput.placeholder =
        'Share your experience about this course...';

    commentInput.minLength = 5;
    commentInput.maxLength = 1000;
    commentInput.required = true;

    const submitButton = createElement(
        'button',
        'feedback-submit',
        'Submit Anonymous Feedback'
    );

    submitButton.type = 'submit';

    const statusMessage = createElement(
        'p',
        'feedback-status'
    );

    form.append(
        ratingLabel,
        ratingSelect,
        commentLabel,
        commentInput,
        submitButton,
        statusMessage
    );

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        hideCourseMessage(statusMessage);

        const rating = Number(ratingSelect.value);
        const comment = commentInput.value.trim();

        if (!rating || rating < 1 || rating > 5) {
            showCourseMessage(
                statusMessage,
                'Please select a rating from 1 to 5.',
                'error'
            );

            return;
        }

        if (comment.length < 5) {
            showCourseMessage(
                statusMessage,
                'Please enter at least 5 characters in your comment.',
                'error'
            );

            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            await apiRequest('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    courseId: Number(course.course_id),
                    rating,
                    comment
                })
            });

            try {
                await loadMonthlyFeedbackStatus();
            } catch (statusError) {
                console.error(
                    'Unable to refresh monthly feedback status:',
                    statusError
                );
            }

            submittedCourseIds.add(Number(course.course_id));

            const details = monthlyFeedbackStatus.get(
                Number(course.course_id)
            );

            form.replaceWith(
                createFeedbackConfirmation(false, details)
            );

            await loadFeedbackCount();

        } catch (error) {
            const isDuplicate =
                error.status === 409 ||
                error.message.toLowerCase().includes('already submitted') ||
                error.message.toLowerCase().includes('duplicate');

            if (isDuplicate) {
                try {
                    await loadMonthlyFeedbackStatus();
                } catch (statusError) {
                    console.error(
                        'Unable to refresh monthly feedback status:',
                        statusError
                    );
                }

                submittedCourseIds.add(Number(course.course_id));

                form.replaceWith(
                    createFeedbackConfirmation(
                        true,
                        monthlyFeedbackStatus.get(Number(course.course_id))
                    )
                );

            } else {
                showCourseMessage(
                    statusMessage,
                    error.message,
                    'error'
                );

                submitButton.disabled = false;
                submitButton.textContent = 'Submit Anonymous Feedback';
            }
        }
    });

    return form;
}

function renderEnrolledCourses(enrollments) {
    if (!courseListElement) return;

    courseListElement.replaceChildren();

    if (courseCountElement) {
        courseCountElement.textContent = enrollments.length;
    }

    if (enrollments.length === 0) {
        courseListElement.appendChild(
            createElement(
                'div',
                'empty-state',
                'You are not enrolled in any courses yet. Browse the available courses above and enroll yourself.'
            )
        );

        return;
    }

    enrollments.forEach((course) => {
        const card = createElement('article', 'course-card');

        const courseId = Number(course.course_id);

        const code = createElement(
            'p',
            'course-code',
            course.course_code || `COURSE ${course.course_id}`
        );

        const title = createElement(
            'h3',
            '',
            course.course_title || 'Course'
        );

        const description = createElement(
            'p',
            'course-description',
            course.course_description || 'No course description available.'
        );

        const currentDateDisplay = createDateInformation(
            'Current date',
            currentDate
        );

        const unenrollButton = createElement(
            'button',
            'secondary-button',
            'Unenroll from This Course'
        );

        unenrollButton.type = 'button';

        const statusMessage = createElement(
            'p',
            'course-action-message'
        );

        unenrollButton.addEventListener('click', async () => {
            const confirmed = window.confirm(
                `Are you sure you want to unenroll from ${course.course_title || 'this course'}?`
            );

            if (!confirmed) return;

            hideCourseMessage(statusMessage);

            unenrollButton.disabled = true;
            unenrollButton.textContent = 'Unenrolling...';

            try {
                await apiRequest(
                    `/api/enrollments/self/${courseId}`,
                    {
                        method: 'DELETE'
                    }
                );

                saveCourseMessage(
                    courseId,
                    `You have successfully unenrolled from ${course.course_title || 'this course'}.`,
                    'success'
                );

                await loadCourses();

            } catch (error) {
                showCourseMessage(
                    statusMessage,
                    error.message,
                    'error'
                );

                unenrollButton.disabled = false;
                unenrollButton.textContent = 'Unenroll from This Course';
            }
        });

        card.append(
            code,
            title,
            description,
            currentDateDisplay,
            unenrollButton,
            statusMessage
        );

        displaySavedCourseMessage(courseId, statusMessage);

        if (submittedCourseIds.has(courseId)) {
            card.appendChild(
                createFeedbackConfirmation(
                    true,
                    monthlyFeedbackStatus.get(courseId)
                )
            );
        } else {
            card.appendChild(
                createFeedbackForm(course)
            );
        }

        courseListElement.appendChild(card);
    });
}

async function loadCourses() {
    hideDashboardMessage();

    if (courseListElement) {
        courseListElement.replaceChildren(
            createElement(
                'p',
                'loading-text',
                'Loading your courses...'
            )
        );
    }

    if (availableCourseListElement) {
        availableCourseListElement.replaceChildren(
            createElement(
                'p',
                'loading-text',
                'Loading available courses...'
            )
        );
    }

    try {
        await loadMonthlyFeedbackStatus();

        const [
            enrollmentResult,
            availableResult
        ] = await Promise.all([
            apiRequest('/api/enrollments/me'),
            apiRequest('/api/enrollments/available')
        ]);

        const enrollments = enrollmentResult.data?.enrollments;
        const availableCourses = availableResult.data?.courses;

        if (
            !Array.isArray(enrollments) ||
            !Array.isArray(availableCourses)
        ) {
            throw new Error(
                'The server returned an unexpected course response.'
            );
        }

        renderEnrolledCourses(enrollments);
        renderAvailableCourses(availableCourses);

    } catch (error) {
        if (courseListElement) {
            courseListElement.replaceChildren(
                createElement(
                    'p',
                    'empty-state',
                    'Unable to load your enrolled courses.'
                )
            );
        }

        if (availableCourseListElement) {
            availableCourseListElement.replaceChildren(
                createElement(
                    'p',
                    'empty-state',
                    'Unable to load available courses.'
                )
            );
        }

        if (courseCountElement) {
            courseCountElement.textContent = '0';
        }

        showDashboardMessage(error.message);
    }
}

if (!studentToken || studentRole !== 'student') {
    window.location.replace('/login.html');

} else {
    const savedName = localStorage.getItem('userName') || 'Student';

    if (studentNameElement) {
        studentNameElement.textContent = savedName;
    }

    if (welcomeNameElement) {
        welcomeNameElement.textContent = savedName;
    }

    loadCourses();
    loadFeedbackCount();
}

if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}

if (refreshButton) {
    refreshButton.addEventListener('click', () => {
        loadCourses();
        loadFeedbackCount();
    });
}
