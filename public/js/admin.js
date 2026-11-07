document.addEventListener('DOMContentLoaded', () => {
    const adminToken = localStorage.getItem('authToken');
    const adminRole = localStorage.getItem('userRole');

    const adminMessage = document.getElementById('adminMessage');
    const adminCourseList = document.getElementById('adminCourseList');
    const reportCourseSelect = document.getElementById('reportCourseId');

    let courses = [];

    function logoutAdmin() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');

        window.location.replace('/login.html');
    }

    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) {
        logoutButton.addEventListener('click', logoutAdmin);
    }

    if (!adminToken || adminRole !== 'admin') {
        logoutAdmin();
        return;
    }

    function showAdminMessage(message, type = 'error') {
        if (!adminMessage) return;

        adminMessage.textContent = message;
        adminMessage.className = `dashboard-message show ${type}`;
    }

    function clearAdminMessage() {
        if (!adminMessage) return;

        adminMessage.textContent = '';
        adminMessage.className = 'dashboard-message';
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;

        return node;
    }

    async function adminRequest(url, options = {}) {
        const token = localStorage.getItem('authToken');

        if (!token) {
            logoutAdmin();
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

        if (response.status === 401 || response.status === 403) {
            if (response.status === 401) {
                logoutAdmin();
            }

            throw new Error(data.message || 'You are not authorized to perform this action.');
        }

        if (!response.ok) {
            throw new Error(data.message || 'The request failed.');
        }

        return data;
    }

    function getDataObject(result) {
        return result?.data || result || {};
    }

    function getCourseArray(result) {
        const data = getDataObject(result);

        if (Array.isArray(data)) return data;
        if (Array.isArray(data.courses)) return data.courses;
        if (Array.isArray(data.items)) return data.items;

        return [];
    }

    function getCourseId(course) {
        return course.id ?? course.course_id;
    }

    function getCourseTitle(course) {
        return course.title || course.course_title || 'Untitled course';
    }

    function getCourseCode(course) {
        return course.code || course.course_code || 'No course code';
    }

    function renderCourseList() {
        if (!adminCourseList || !reportCourseSelect) return;

        adminCourseList.replaceChildren();
        reportCourseSelect.replaceChildren();

        const placeholder = element('option', '', 'Select a course');
        placeholder.value = '';
        reportCourseSelect.appendChild(placeholder);

        const totalCourses = document.getElementById('totalCourses');

        if (totalCourses) {
            totalCourses.textContent = courses.length;
        }

        if (courses.length === 0) {
            adminCourseList.appendChild(
                element('p', 'empty-state', 'No courses have been created yet.')
            );
            return;
        }

        courses.forEach((course) => {
            const id = getCourseId(course);
            const card = element('article', 'admin-course-card');

            card.appendChild(
                element('p', 'course-code', getCourseCode(course))
            );

            card.appendChild(
                element('h4', '', getCourseTitle(course))
            );

            card.appendChild(
                element(
                    'p',
                    '',
                    course.description ||
                    course.course_description ||
                    'No description available.'
                )
            );

            card.appendChild(
                element('span', 'admin-course-id', `Course ID: ${id}`)
            );

            const courseActions = element('div', 'admin-course-actions');
            const deleteButton = element('button', 'delete-course-button');
deleteButton.innerHTML = '<span class="delete-icon">🗑</span><span>Delete Course</span>';
            const deleteMessage = element('p', 'course-delete-message', '');

            deleteButton.type = 'button';

            deleteButton.addEventListener('click', async () => {
                const confirmed = window.confirm(
                    `Are you sure you want to delete ${getCourseCode(course)} - ${getCourseTitle(course)}? This action cannot be undone.`
                );

                if (!confirmed) return;

                deleteButton.disabled = true;
                deleteButton.textContent = 'Deleting...';
                deleteMessage.textContent = '';
                deleteMessage.className = 'course-delete-message';

                try {
                    await adminRequest(`/api/courses/${encodeURIComponent(id)}`, {
                        method: 'DELETE'
                    });

                    courses = courses.filter(
                        (item) => String(getCourseId(item)) !== String(id)
                    );

                    renderCourseList();

                    showAdminMessage(
                        `${getCourseCode(course)} was deleted successfully.`,
                        'success'
                    );

                    await loadDashboardSummary();
                } catch (error) {
                    deleteMessage.textContent = error.message;
                    deleteMessage.className = 'course-delete-message show error';
                    deleteButton.disabled = false;
                    deleteButton.innerHTML = '<span class="delete-icon">🗑</span><span>Delete Course</span>';
                }
            });

            courseActions.appendChild(deleteButton);
            card.appendChild(courseActions);
            card.appendChild(deleteMessage);

            adminCourseList.appendChild(card);

            const option = element(
                'option',
                '',
                `${getCourseCode(course)} - ${getCourseTitle(course)} (ID: ${id})`
            );

            option.value = id;
            reportCourseSelect.appendChild(option);
        });
    }

    async function loadCourses() {
        if (!adminCourseList) return;

        adminCourseList.replaceChildren(
            element('p', 'loading-text', 'Loading courses...')
        );

        try {
            const result = await adminRequest('/api/courses');

            courses = getCourseArray(result);
            renderCourseList();
        } catch (error) {
            adminCourseList.replaceChildren();
            showAdminMessage(`Could not load courses: ${error.message}`);
        }
    }

async function loadDashboardSummary() {
    const result = await adminRequest('/api/admin/dashboard');
    const data = getDataObject(result);

    const courseReports = Array.isArray(data.courses)
        ? data.courses
        : [];

    const totalFeedback = courseReports.reduce((total, course) => {
        return total + (Number(course.totalFeedback) || 0);
    }, 0);

    const totalRating = courseReports.reduce((total, course) => {
        const submissions = Number(course.totalFeedback) || 0;
        const average = Number(course.averageRating) || 0;

        return total + (average * submissions);
    }, 0);

    const overallAverage = totalFeedback > 0
        ? totalRating / totalFeedback
        : null;

    const totalFeedbackElement = document.getElementById('totalFeedback');
    const overallRatingElement = document.getElementById('overallRating');

    if (totalFeedbackElement) {
        totalFeedbackElement.textContent = totalFeedback;
    }

    if (overallRatingElement) {
        overallRatingElement.textContent = overallAverage === null
            ? '—'
            : overallAverage.toFixed(2) + ' / 5';
    }
}

    const courseForm = document.getElementById('courseForm');

    if (courseForm) {
        courseForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAdminMessage();

            const button = document.getElementById('createCourseButton');
            const code = document.getElementById('courseCode').value.trim();
            const title = document.getElementById('courseTitle').value.trim();
            const description = document.getElementById('courseDescription').value.trim();

            if (!code || !title) {
                showAdminMessage('Please enter the course code and title.');
                return;
            }

            button.disabled = true;
            button.textContent = 'Creating...';

            try {
                await adminRequest('/api/courses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        code,
                        title,
                        description
                    })
                });

                showAdminMessage('Course created successfully.', 'success');
                event.target.reset();

                await loadCourses();
                await loadDashboardSummary();
            } catch (error) {
                showAdminMessage(error.message);
            } finally {
                button.disabled = false;
                button.textContent = 'Create Course';
            }
        });
    }

    const enrollmentForm = document.getElementById('enrollmentForm');

    if (enrollmentForm) {
        enrollmentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAdminMessage();

            const button = document.getElementById('enrollButton');
            const studentId = Number(document.getElementById('studentId').value);
            const courseId = Number(document.getElementById('enrollmentCourseId').value);

            if (
                !Number.isInteger(studentId) || studentId < 1 ||
                !Number.isInteger(courseId) || courseId < 1
            ) {
                showAdminMessage('Enter valid positive student and course IDs.');
                return;
            }

            button.disabled = true;
            button.textContent = 'Enrolling...';

            try {
                await adminRequest('/api/enrollments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        studentId,
                        courseId
                    })
                });

                showAdminMessage('Student enrolled successfully.', 'success');
                event.target.reset();
            } catch (error) {
                showAdminMessage(error.message);
            } finally {
                button.disabled = false;
                button.textContent = 'Enroll Student';
            }
        });
    }

    function findArray(data, possibleKeys) {
        if (Array.isArray(data)) return data;

        for (const key of possibleKeys) {
            if (Array.isArray(data?.[key])) {
                return data[key];
            }
        }

        return [];
    }

    function findValue(data, possibleKeys) {
        for (const key of possibleKeys) {
            if (data?.[key] !== undefined && data[key] !== null) {
                return data[key];
            }
        }

        return undefined;
    }

    function renderReport(summaryResult, feedbackResult) {
        const reportArea = document.getElementById('reportArea');

        if (!reportArea) return;

        reportArea.replaceChildren();

        const summary = getDataObject(summaryResult);
        const feedbackData = getDataObject(feedbackResult);

        const feedback = findArray(feedbackData, [
            'feedback',
            'comments',
            'submissions',
            'items'
        ]);

        const total = findValue(summary, [
            'totalFeedback',
            'total_feedback',
            'totalSubmissions',
            'total_submissions',
            'count'
        ]) ?? feedback.length;

        const average = findValue(summary, [
            'averageRating',
            'average_rating',
            'average',
            'avgRating',
            'avg_rating'
        ]);

        const summaryCards = element('div', 'report-summary');

        [
            ['Total submissions', total],
            [
                'Average rating',
                average !== undefined
                    ? `${Number(average).toFixed(2)} / 5`
                    : 'Not provided'
            ],
            ['Comments displayed', feedback.length]
        ].forEach(([label, value]) => {
            const card = element('div', 'report-stat');

            card.appendChild(element('span', '', label));
            card.appendChild(element('strong', '', String(value)));

            summaryCards.appendChild(card);
        });

        reportArea.appendChild(summaryCards);

        const ratingCounts = findValue(summary, [
            'ratingCounts',
            'rating_counts',
            'ratings'
        ]);

        if (ratingCounts && typeof ratingCounts === 'object') {
            const bars = element('div', 'rating-bars');

            bars.appendChild(
                element('h3', '', 'Rating Breakdown')
            );

            for (let rating = 5; rating >= 1; rating--) {
                const count = Number(
                    Array.isArray(ratingCounts)
                        ? ratingCounts.find(
                            (item) => Number(item.rating) === rating
                        )?.count || 0
                        : ratingCounts[rating] || 0
                );

                const row = element('div', 'rating-row');

                row.appendChild(
                    element('span', '', `${rating} stars`)
                );

                const track = element('div', 'rating-track');
                const fill = element('div', 'rating-fill');

                fill.style.width = Number(total) > 0
                    ? `${Math.min(100, (count / Number(total)) * 100)}%`
                    : '0%';

                track.appendChild(fill);
                row.appendChild(track);

                row.appendChild(
                    element('span', '', String(count))
                );

                bars.appendChild(row);
            }

            reportArea.appendChild(bars);
        }

        const feedbackHeading = element('h3', '', 'Anonymous Comments');
        const feedbackList = element('div', 'feedback-list');

        feedbackList.appendChild(feedbackHeading);

        if (feedback.length === 0) {
            feedbackList.appendChild(
                element(
                    'p',
                    'empty-state',
                    'No comments are available. Comments may also be hidden by the privacy threshold.'
                )
            );
        } else {
            feedback.forEach((item) => {
                const feedbackItem = element('article', 'feedback-item');

                const rating = item.rating ?? item.averageRating;

                feedbackItem.appendChild(
                    element(
                        'strong',
                        '',
                        rating !== undefined
                            ? `Rating: ${rating} / 5`
                            : 'Anonymous feedback'
                    )
                );

                if (item.comment) {
                    feedbackItem.appendChild(
                        element('p', '', item.comment)
                    );
                }

                if (item.createdAt || item.created_at) {
                    const date = new Date(
                        item.createdAt || item.created_at
                    );

                    feedbackItem.appendChild(
                        element(
                            'div',
                            'feedback-date',
                            Number.isNaN(date.getTime())
                                ? ''
                                : date.toLocaleDateString()
                        )
                    );
                }

                feedbackList.appendChild(feedbackItem);
            });
        }

        reportArea.appendChild(feedbackList);
    }

    const loadReportButton = document.getElementById('loadReportButton');

    if (loadReportButton) {
        loadReportButton.addEventListener('click', async () => {
            clearAdminMessage();

            const courseId = reportCourseSelect?.value;

            if (!courseId) {
                showAdminMessage('Please select a course first.');
                return;
            }

            loadReportButton.disabled = true;
            loadReportButton.textContent = 'Loading report...';

            try {
                const [feedbackResult, summaryResult] = await Promise.all([
                    adminRequest(
                        `/api/admin/feedback/${encodeURIComponent(courseId)}`
                    ),
                    adminRequest(
                        `/api/admin/feedback/${encodeURIComponent(courseId)}/summary`
                    )
                ]);

                renderReport(summaryResult, feedbackResult);
            } catch (error) {
                showAdminMessage(
                    `Could not load the report: ${error.message}`
                );
            } finally {
                loadReportButton.disabled = false;
                loadReportButton.textContent = 'View Report';
            }
        });
    }

    const refreshCoursesButton = document.getElementById('refreshCoursesButton');

    if (refreshCoursesButton) {
        refreshCoursesButton.addEventListener('click', async () => {
            clearAdminMessage();

            await loadCourses();
            await loadDashboardSummary();
        });
    }

    loadCourses();
    loadDashboardSummary();
});
