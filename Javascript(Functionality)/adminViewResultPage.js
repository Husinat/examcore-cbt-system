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





// FIREBASE IMPORTS
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';


// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB3kyJ6WefUF3e-KFeEUtnxeTR6SgIXIvU",
    authDomain: "examcore-project.firebaseapp.com",
    projectId: "examcore-project",
    storageBucket: "examcore-project.firebasestorage.app",
    messagingSenderId: "69753766233",
    appId: "1:69753766233:web:2105b3871aa982e3828c48"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const logoLink = document.getElementById('logoLink');
logoLink.addEventListener('click', e => {
  e.preventDefault();
});
logoLink.classList.toggle('cursor-not-allowed', true);

const adminAvatar = document.getElementById('admin-avatar');
adminAvatar.addEventListener('click', e => {
const dropdown = document.getElementById('admin-dropdown');
if (dropdown){
    dropdown.classList.toggle('hidden');
}
});






// UPDATING ADMIN AVATAR
// HELPERS
function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function getInitials(fullName) {
    if (!fullName) return "👤";
    const parts = fullName.trim().split(" ");
    return parts[0].charAt(0).toUpperCase() + (parts[1] ? parts[1].charAt(0).toUpperCase() : "");
}


// ADMIN AUTH GUARD
onAuthStateChanged(auth, async (user) => {
        if (!user) {
        window.location.href = "../index.html";
        return;
    }
    // Check if user is admin
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
            // Not admin, redirect to student dashboard
            window.location.href = './student-dashboard.html';
            return;
        }

        // User is admin, proceed to load results
        fetchResults();

    } catch (error) {
        console.error('Error checking admin status:', error);
        window.location.href = './student-dashboard.html';
    }
    try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data();


        if (!userSnap.exists() || userSnap.data().role !== "admin") {
            alert("Access denied. Admins only.");
            window.location.href = "../StudentPages/dashboard.html";
            return;
        }
       const userFullName = userData.fullname || user.email || "Admin";
       const initials = getInitials(userFullName);
       updateElementText("admin-avatar", initials);
        const fullName = userData.fullname || "Admin";
        const email = userData.email || user.email;

        // Desktop
        updateElementText("admin-name", fullName);
        updateElementText("dropdown-admin-name", fullName);
        updateElementText("dropdown-admin-email", email);
        updateElementText("admin-avatar", initials);

        // Mobile
        updateElementText("mobile-admin-name", fullName);
        updateElementText("mobile-admin-email", email);
        updateElementText("mobile-admin-avatar", initials);
         
    } catch (err) {
        console.error("Error checking admin status:", err);
    }
});





// STATE VARIABLES
let results = [];

// UI ELEMENTS
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const resultsTable = document.getElementById('results-table');
const resultsTbody = document.getElementById('results-tbody');


// SHOW/HIDE STATES
function showLoading() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultsTable.classList.add('hidden');
}

function showEmpty() {
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    errorState.classList.add('hidden');
    resultsTable.classList.add('hidden');
}

function showError() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.remove('hidden');
    resultsTable.classList.add('hidden');
}

function showResults() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultsTable.classList.remove('hidden');
}

// FETCH RESULTS FROM FIRESTORE
async function fetchResults() {
    showLoading();

    try {
        const resultsRef = collection(db, 'ExamResults');
        const resultsSnap = await getDocs(resultsRef);

        results = [];

        for (const docSnap of resultsSnap.docs) {
            const resultData = docSnap.data();

            // Fetch student info
            let studentName = 'Unknown Student';
            let studentEmail = '';

            try {
                const userDoc = await getDoc(doc(db, 'users', resultData.userId));
                if (userDoc.exists()) {
                    studentName = userDoc.data().fullname || userDoc.data().displayName || 'Unknown';
                    studentEmail = userDoc.data().email || '';
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'User does not exist. Failed to fetch user information.'
        });
            }

            results.push({
                id: docSnap.id,
                studentName,
                studentEmail,
                ...resultData
            });
        }
        console.log(results);
        

        if (results.length === 0) {
            showEmpty();
        } else {
            totalSubmissions();
            renderResults();
            showResults();
        }

    } catch (error) {
        console.error('Error fetching results:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch exam results.'
        });
        showError();
    }
}


// CALCULATE STATISTICS
function totalSubmissions() {
    const totalSubmissions = results.length;

    let totalScore = 0;
    let passedCount = 0;
    let validResults = 0;

    results.forEach(result => {

        const score = result.score || 0;
        const totalQuestions = result.totalQuestions || 0;

        if (totalQuestions === 0) {
            return;
        }

        const percentage = (score / totalQuestions) * 100;

        totalScore += percentage;
        validResults++;

        if (percentage >= 50) {
            passedCount++;
        }
    });

    const averageScore = validResults > 0 ? Math.round(totalScore / validResults) : 0;
    const passRate = validResults > 0 ? Math.round((passedCount / validResults) * 100) : 0;

    document.getElementById('total-submissions').textContent = totalSubmissions;
    document.getElementById('average-score').textContent = averageScore;
    document.getElementById('pass-rate').textContent = passRate;
}


// RENDER RESULTS TABLE
function renderResults() {
    resultsTbody.innerHTML = '';

    // Sort by timestamp (newest first)
    results.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(0);
        const dateB = b.timestamp?.toDate?.() || new Date(0);
        return dateB - dateA;
    });

    // Check if empty
    if (results.length === 0) {
        showEmpty();
        return;
    }

    results.forEach((result, i) => {
        const score = result.score || 0;
        const totalQuestions = result.totalQuestions || 0;
        const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
        const date = result.timestamp?.toDate?.() || new Date();
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Single row with mobile AND desktop views inside
        resultsTbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="px-6 py-4">
                    <!-- MOBILE VIEW -->
                    <div class="md:hidden space-y-3">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <p class="text-sm text-slate-500 dark:text-slate-400">Result #${i + 1}</p>
                                <p class="font-semibold text-slate-900 dark:text-white mt-1">${result.studentName}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">${result.studentEmail}</p>
                            </div>
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                percentage >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                percentage >= 50 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }">
                                ${percentage}%
                            </span>
                        </div>
                        <div class="text-sm space-y-1">
                            <p class="text-slate-600 dark:text-slate-400"><span class="font-medium">Exam:</span> ${result.examTitle || 'Unknown'}</p>
                            <p class="text-slate-600 dark:text-slate-400"><span class="font-medium">Score:</span> ${score} / ${totalQuestions}</p>
                            <p class="text-slate-600 dark:text-slate-400"><span class="font-medium">Date:</span> ${formattedDate}</p>
                        </div>

                        <div class="flex gap-10 pt-2">
                            <button onclick="viewDetails('${result.id}')" class="flex-1 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                View Details
                            </button>
                            <button data-delete="${result.id}" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                        
                    </div>

                    <!-- DESKTOP VIEW -->
                    <div class="hidden md:grid md:grid-cols-5 gap-4 items-center">
                        <div>
                            <p class="text-sm font-medium text-slate-900 dark:text-white">${result.studentName}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400">${result.studentEmail}</p>
                        </div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">
                            ${result.examTitle || result.examId || 'Unknown Exam'}
                        </div>
                        <div>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                percentage >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                percentage >= 50 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }">
                                ${score} / ${totalQuestions} (${percentage}%)
                            </span>
                        </div>
                        <div class="text-sm text-slate-600 dark:text-slate-400">
                            ${formattedDate}
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="viewDetails('${result.id}')" class="text-brand-600 dark:text-brand-400 hover:underline font-medium text-sm">
                                View
                            </button>
                            <button data-delete="${result.id}" class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    attachDeleteListeners();
}

// Delete Result
function attachDeleteListeners() {
    // Find all delete buttons
    const deleteButtons = document.querySelectorAll('[data-delete]');
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const resultId = button.getAttribute('data-delete');
            await deleteResult(resultId);
        });
    });
}




// Delete From Firestore Function
async function deleteResult(resultId) {
    const confirmation = await Swal.fire({
        title: 'Delete Result?',
        text: 'This will permanently delete this exam result. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel'
    });
    if (!confirmation.isConfirmed) return;

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'ExamResults', resultId));

        // Show success message
        Swal.fire({
            title: 'Deleted!',
            text: 'Exam result has been deleted successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        fetchResults();

    } catch (error) {
        console.error('Error deleting result:', error);
        Swal.fire({
            title: 'Error',
            text: 'Failed to delete result. Please try again.',
            icon: 'error'
        });
    }
}




// VIEW DETAILS MODAL

window.viewDetails = (resultId) => {
    const result = results.find(r => r.id === resultId);
    if (!result) return;

    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    let answersHtml = '';
    if (result.answers && Array.isArray(result.answers)) {
        answersHtml = result.answers.map((answer, index) => `
                    <div class="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-3">
                        <div class="flex items-start justify-between mb-2">
                            <span class="text-sm font-semibold text-slate-900 dark:text-white">Question ${index + 1}</span>
                            ${answer.selectedOption === answer.correctAnswer
                ? '<span class="text-xs font-semibold text-green-600 dark:text-green-400"><i class="fa-solid fa-circle-check mr-1"></i>Correct</span>'
                : '<span class="text-xs font-semibold text-red-600 dark:text-red-400"><i class="fa-solid fa-circle-xmark mr-1"></i>Wrong</span>'
            }
                        </div>
                        <div class="text-sm space-y-1">
                            <p class="text-slate-600 dark:text-slate-400">
                                <span class="font-medium">Student Answer:</span> 
                                <span class="${answer.selectedOption === answer.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-semibold">
                                    ${answer.selectedOption || 'Not Answered'}
                                </span>
                            </p>
                            <p class="text-slate-600 dark:text-slate-400">
                                <span class="font-medium">Correct Answer:</span> 
                                <span class="text-green-600 dark:text-green-400 font-semibold">${answer.correctAnswer}</span>
                            </p>
                        </div>
                    </div>
                `).join('');
    } else {
        answersHtml = '<p class="text-slate-500 dark:text-slate-400 text-center py-4">Detailed answers not available</p>';
    }

    Swal.fire({
        title: 'Exam Details',
        width: '90%',
        maxWidth: '700px',
        html: `
                    <div class="text-left">
                        <!-- Student Info -->
                        <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Student</p>
                                    <p class="text-sm font-semibold text-slate-900 dark:text-white">${result.studentName}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Exam</p>
                                    <p class="text-sm font-semibold text-slate-900 dark:text-white">${result.examTitle}</p>
                                </div>
                                <div>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Score</p>
                                    <p class="text-sm font-semibold ${percentage >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                                        ${result.score} / ${result.totalQuestions} (${percentage}%)
                                    </p>
                                </div>
                                <div>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${percentage >= 50
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }">
                                        ${percentage >= 50 ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Answers Breakdown -->
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Answers Breakdown</h3>
                        <div class="max-h-96 overflow-y-auto pr-2">
                            ${answersHtml}
                        </div>
                    </div>
                `,
        confirmButtonText: 'Close',
        customClass: {
            confirmButton: 'bg-brand-600 hover:bg-brand-700',
            popup: 'overflow-hidden',
            htmlContainer: 'overflow-visible'
        }
    });
};



// Dropdown Logout Btn
async function dashBoardLogOutBtn() {
    try {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out of your account.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2e8ff7",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, log out",
            cancelButtonText: "Cancel"
        });
        if (result.isConfirmed) {
            await signOut(auth);
            window.location.href = "../index.html";
        }
    } catch (err) {
         console.error(err);
          Swal.fire({
            icon:"error",
            title:"Error",
            text:"Failed to logout. Try again."
        }); }
}

let dropdownlogBtn = document.getElementById('logout-btn');
if (dropdownlogBtn) dropdownlogBtn.addEventListener('click', dashBoardLogOutBtn);
