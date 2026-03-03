// Dark Mode Script
const toggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('icon-sun');
const moonIcon = document.getElementById('icon-moon');

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
}

toggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        localStorage.setItem('theme', 'light');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
});

// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB3kyJ6WefUF3e-KFeEUtnxeTR6SgIXIvU",
    authDomain: "examcore-project.firebaseapp.com",
    projectId: "examcore-project",
    storageBucket: "examcore-project.firebasestorage.app",
    messagingSenderId: "69753766233",
    appId: "1:69753766233:web:2105b3871aa982e3828c48"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Avatar & Auth Guard
const userAvatar = document.getElementById('user-avatar');
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '../index.html';
        return;
    }

    // Set initials from displayName or email
    const name = user.displayName || user.email || 'User';
    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    userAvatar.textContent = initials;

    // Load results after authentication
    loadResults();
});

// Load results
async function loadResults() {
    try {
        const params = new URLSearchParams(window.location.search);
        const resultId = params.get('id');
        if (!resultId) throw new Error("No result ID in URL");

        const resultDoc = await getDoc(doc(db, "ExamResults", resultId));
        if (!resultDoc.exists()) throw new Error("Result not found");

        const data = resultDoc.data();

        // Update score cards
        const totalQuestions = data.totalQuestions || 40;
        const correctAnswers = data.score || 0;
        const wrongAnswers = totalQuestions - correctAnswers;
        const percentage = Math.round((correctAnswers / totalQuestions) * 100) || 0;

        document.getElementById('total-questions').textContent = totalQuestions;
        document.getElementById('correct-answers').textContent = correctAnswers;
        document.getElementById('wrong-answers').textContent = wrongAnswers;
        document.getElementById('percentage-display').textContent = percentage + '%';

        // Animate progress circle
        const circle = document.getElementById('progress-circle');
        if (circle) {
            const radius = 54;
            const circumference = 2 * Math.PI * radius;
            let offset = circumference;
            circle.style.strokeDasharray = circumference;
            const step = () => {
                const targetOffset = circumference - (percentage / 100) * circumference;
                offset += (targetOffset - offset) * 0.1; // smooth easing
                circle.style.strokeDashoffset = offset;
                if (Math.abs(offset - targetOffset) > 0.5) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        // Pass/Fail badge
        const statusBadge = document.getElementById('status-badge');
        if (percentage >= 50) {
            statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Passed</span>';
            statusBadge.className = 'mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800 font-semibold';
        } else {
            statusBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i><span>Failed</span>';
            statusBadge.className = 'mt-6 inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800 font-semibold';
        }

        // Exam title
        if (data.examId) {
            const examDoc = await getDoc(doc(db, "Exams", data.examId));
            if (examDoc.exists()) {
                document.getElementById('exam-title').textContent = examDoc.data().title || 'Exam Results';
            }
        }

        // Exam date & time
        if (data.timestamp) {
            const date = data.timestamp.toDate();
            document.getElementById('exam-date').textContent = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('exam-time').textContent = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
        }

        // Hide loading, show content
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('results-content').classList.remove('hidden');

    } catch (error) {
        console.error("Error loading results:", error);
        document.getElementById('loading-state').style.display = 'none';
        document.getElementById('results-content').classList.remove('hidden');

        // Alert
        Swal.fire('Error', 'Could not load exam results.', 'error');
    }
}

// Retake Exam Button
const retakeBtn = document.getElementById('retake-exam-btn');
if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
        window.location.href = './availableExams.html';
    });
}