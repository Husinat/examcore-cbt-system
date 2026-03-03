import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration - REPLACE WITH YOUR CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyB3kyJ6WefUF3e-KFeEUtnxeTR6SgIXIvU",
    authDomain: "examcore-project.firebaseapp.com",
    projectId: "examcore-project",
    storageBucket: "examcore-project.firebasestorage.app",
    messagingSenderId: "69753766233",
    appId: "1:69753766233:web:2105b3871aa982e3828c48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);


// DOM ELEMENTS

const loadingState = document.getElementById('loading-state');
const examsContainer = document.getElementById('exams-container');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const retryBtn = document.getElementById('retry-btn');
export const userAvatar = document.getElementById('user-avatar');


// AUTHENTICATION GUARD: Redirect to signin page if user is not authenticated

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        // User not logged in - redirect to signin page
        window.location.href = '../index.html';
        return;
    }

    // User is authenticated - proceed to load exams
    console.log('User authenticated:', user.uid);

    // Set user avatar (first letter of email)
    const firstLetter = user.email ? user.email.charAt(0).toUpperCase() : 'U';
    userAvatar.textContent = firstLetter;

    // Load exams from Firestore
    await loadExams();
});


// FETCHING EXAMS FROM FIRESTORE

export async function loadExams() {
    try {
        // Show loading state
        showLoading();

        const examsRef = collection(db, 'Exams');
        const querySnapshot = await getDocs(examsRef);

        if (querySnapshot.empty) {
            showEmptyState();
            return;
        }

        const exams = [];
        querySnapshot.forEach((doc) => {
            exams.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Render exam cards
        renderExams(exams);
        showExamsGrid();

    } catch (error) {
        console.error('Error loading exams:', error);
        showErrorState();
    }
}

// RENDER EXAM CARDS

function renderExams(exams) {
    // Clear container
    examsContainer.innerHTML = '';

    // Generate cards dynamically
    exams.forEach((exam, index) => {
        const card = createExamCard(exam, index);
        examsContainer.appendChild(card);
    });
}


// CREATING INDIVIDUAL EXAM CARD


function createExamCard(exam, index) {
    // card wrapper
    const card = document.createElement('div');
    card.className = 'exam-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    // Card inner HTML structure
    card.innerHTML = `
                <!-- Color accent bar -->
                <div class="h-2 bg-gradient-to-r from-brand-500 to-brand-600"></div>
                
                <!-- Card content -->
                <div class="p-6 sm:p-8">
                    
           <!-- Header with icon and duration badge -->
     <div class="flex items-start justify-between mb-4">
    <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 flex items-center justify-center shadow-lg shadow-brand-900/20 dark:shadow-brand-950/50">
        <i class="fa-solid fa-graduation-cap text-2xl text-white"></i>
    </div>
    <span class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 rounded-full border border-brand-200 dark:border-brand-800">
        <!-- Clock SVG -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ${exam.duration || 'N/A'} min
    </span>
   </div>

                    <!-- Exam title -->
                    <h3 class="text-xl font-semibold text-slate-900 dark:text-black mb-2">
                        ${escapeHtml(exam.title || 'Untitled Exam')}
                    </h3>

                    <!-- Subject badge -->
                    <div class="mb-3 flex gap-10">
                   <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-brand-600 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-brand-800">
    <i class="fa-solid fa-book text-[10px] dark:text-brand-100"></i>
    ${escapeHtml(exam.subject || 'General')}
</span>



<span class="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-brand-100 dark:bg-brand-900/70 text-brand-700 dark:text-brand-200 rounded-full border border-brand-200 dark:border-brand-800">
    <!-- Question Icon -->
    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
    </svg>
    ${exam.totalQuestions || 'N/A'} Qs
</span>
                    </div>

                    <!-- Description -->
                    <p class="text-sm text-slate-600 dark:text-slate-600 mb-6 line-clamp-2">
                        ${escapeHtml(exam.description || 'No description available.')}
                    </p>

                    <!-- Start Exam Button -->
                    <button 
                        onclick="startExam('${exam.id}')"
                        class="w-full bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 active:from-brand-800 active:to-brand-900 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <span>Start Exam</span>
                        <i class="fa-solid fa-arrow-right text-sm"></i>
                    </button>

                </div>
            `;
            console.log("Exam ID:", exam.id);
    return card;
}

// START EXAM FUNCTION
window.startExam = function (examId) {
    // Validate exam ID
    if (!examId) {
        console.error('Invalid exam ID');
        return;
    }

    // Navigate to exam page with ID parameter
    window.location.href = `exam.html?id=${examId}`;
};


// UI STATE MANAGEMENT

function showLoading() {
    loadingState.classList.remove('hidden');
    examsContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
}

function showExamsGrid() {
    loadingState.classList.add('hidden');
    examsContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
}

function showEmptyState() {
    loadingState.classList.add('hidden');
    examsContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    errorState.classList.add('hidden');
}

function showErrorState() {
    loadingState.classList.add('hidden');
    examsContainer.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.remove('hidden');
}




// Escape HTML to prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Retry button handler
retryBtn.addEventListener('click', loadExams);





// DARK MODE TOGGLE : Theme Switcher (Light and Dark Mode) & remembering theme preference on reload
let toggleBtn = document.getElementById('theme-toggle');

toggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');

    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}