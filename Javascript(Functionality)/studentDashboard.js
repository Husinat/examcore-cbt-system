// Theme Switcher (Light and Dark Mode)
let toggleBtn = document.getElementById('theme-toggle');

toggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

// Profile & hamburger Dropdown
let profileDrop = document.getElementById('profile-dropdown');
let profileBtn = document.getElementById('profile-btn');

if (profileBtn) {
    profileBtn.addEventListener('click', () => profileDrop.classList.toggle('hidden'));
}

let hamburgerBtn = document.getElementById('mobile-menu-btn');
let mobileMenu = document.getElementById('mobile-menu');
let openIcon = document.getElementById('hamburger-icon');
let closeIcon = document.getElementById('close-icon');

if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        openIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
    });
}




// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
const dataBase = getFirestore(app);

// Adding page loader for better UX on dashboard that shows until all data is loaded
const pageLoader = document.getElementById('page-loader');
pageLoader.classList.remove('hidden');
const examsSnap = await getDocs(collection(dataBase, "Exams"));
const exams = [];
        
    // Hiding the page loader
    pageLoader.classList.add('hidden');


// Helper to update element text
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

// Helper to get initials
function getInitials(fullName) {
    if (!fullName) return "👤";
    const parts = fullName.trim().split(" ");
    return parts[0].charAt(0).toUpperCase() + (parts[1] ? parts[1].charAt(0).toUpperCase() : "");
}

onAuthStateChanged(auth, async (loggedInUser) => {
    if (!loggedInUser) {
        window.location.href = "./../index.html";
        return;
    }

    try {
        const uid = loggedInUser.uid;

        // ---- PROFILE ----
        const userSnap = await getDoc(doc(dataBase, "users", uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        const fullName = userData.fullname || "Student";
        const email = userData.email || loggedInUser.email;
        const initials = getInitials(fullName);

        updateElementText('welcome-name', fullName);
        updateElementText('user-name', fullName);
        updateElementText('dropdown-user-name', fullName);
        updateElementText('dropdown-user-email', email);
        updateElementText('mobile-user-name', fullName);
        updateElementText('mobile-user-email', email);
        updateElementText('user-avatar', initials);
        updateElementText('mobile-user-avatar', initials);



        // Total exams
        const totalExamsSnap = await getDocs(collection(dataBase, "Exams"));
        updateElementText('totalExams', totalExamsSnap.size);

        // Exams completed
        const resultsSnap = await getDocs(query(collection(dataBase, "ExamResults"),
         where("userId", "==", uid)));
        updateElementText('examsTaken', resultsSnap.size);

        // Average score
        let totalScore = 0;
        resultsSnap.forEach(r => totalScore += Number(r.data().score || 0));
        const averageScore = resultsSnap.size ? Math.round(totalScore / resultsSnap.size) : 0;
        updateElementText('averageScore', averageScore + '%');



        // Last exam score
        const lastExamSnap = await getDocs(query(
            collection(dataBase, "ExamResults"),
            where("userId", "==", uid),
            orderBy("timestamp", "desc"),
            limit(1)
        ));

        if (!lastExamSnap.empty) {
            const lastScore = Number(lastExamSnap.docs[0].data().score || 0);
            updateElementText('lastScore', lastScore + '%');
        }

        // ---- RECENT ACTIVITY ----
        await loadRecentActivities(uid);

    } catch (err) {
        console.error("Error loading dashboard:", err);
    }
});



// View result History
const viewResultsBtn = document.getElementById('view-results-btn');
if (viewResultsBtn) {
    viewResultsBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
        Swal.fire({title:'Fetching Result...',
        allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
        try {
            const qSnap = await getDocs(query(
                collection(dataBase, "ExamResults"),
                where("userId","==",user.uid),
                orderBy("timestamp","desc"),
                limit(1)
            ));
            Swal.close();
            if (!qSnap.empty) {
                window.location.href = `./resultHistory.html?id=${qSnap.docs[0].id}`;
            }else Swal.fire({
                icon:'info',
                title:'No Results Found',
                text:'You haven\'t taken any exams yet.',
                confirmButtonColor:'#2e8ff7'
            });
        } catch(err) { 
            console.error(err);
             Swal.close(); Swal.fire({
                icon:'error',
                title:'Error',
                text:'Failed to load results. Please try again.',
                confirmButtonColor:'#2e8ff7'}); }
    });
}

// Update profile
const updateProfileBtn = document.getElementById('update-profile-btn');
if (updateProfileBtn) updateProfileBtn.addEventListener('click', () => window.location.href = "./updateProfile.html");



let recentResults = [];

// Loading recent activities and fetching exam names
async function loadRecentActivities(userId) {
    const container = document.getElementById('recent-activity-container');
    const loadingSpinner = document.getElementById('activity-loading');
    
    if (!container) return;

    try {
        // ✅ SHOW SPINNER, HIDE CONTAINER
        loadingSpinner.classList.remove('hidden');
        container.classList.add('hidden');

        const recentQuery = query(
            collection(dataBase, "ExamResults"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(recentQuery);
        
        // Clear and rebuild the global array
        recentResults = [];
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `
                <div class="text-center py-12 text-slate-500 dark:text-slate-400">
                    <i class="fa-solid fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>No recent activity. Start taking exams to see your progress!</p>
                </div>
            `;
            // ✅ HIDE SPINNER, SHOW CONTAINER
            loadingSpinner.classList.add('hidden');
            container.classList.remove('hidden');
            return;
        }

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            let examName = "Unnamed Exam";

            // Fetch exam document to get name
            if (data.examId) {
                const examDoc = await getDoc(doc(dataBase, "Exams", data.examId));
                if (examDoc.exists()) examName = examDoc.data().title || "Unnamed Exam";
            }

            const score = data.score || 0;
            const totalQuestions = data.totalQuestions || 0;
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            const status = percentage >= 50 ? "Passed" : "Failed";
            const time = data.timestamp ? timeAgo(data.timestamp) : "";

            // Store in global array
            recentResults.push({
                id: docSnap.id,
                examTitle: examName,
                score: score,
                totalQuestions: totalQuestions,
                timestamp: data.timestamp,
                answers: data.answers,
                userId: userId
            });

            const activityItem = document.createElement('div');
            activityItem.className = "flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm";

            activityItem.innerHTML = `
                <div>
                    <p class="font-medium text-slate-900 dark:text-white">${examName}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${time}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${status === 'Passed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${percentage}%</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${status}</p>
                </div>
                <div>
                    <button onclick="viewDetails('${docSnap.id}')" class="text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none">
                        View Details
                    </button>
                </div>
            `;

            container.appendChild(activityItem);
        }

        // ✅ HIDE SPINNER, SHOW CONTAINER
        loadingSpinner.classList.add('hidden');
        container.classList.remove('hidden');

    } catch (err) {
        console.error("Error loading recent activities:", err);
        
        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
                <p>Failed to load recent activity.</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                    Retry
                </button>
            </div>
        `;
        
        // ✅ HIDE SPINNER, SHOW ERROR
        loadingSpinner.classList.add('hidden');
        container.classList.remove('hidden');
    }
}


// View Details modal that pops up on click on the view details link on dashboard (using SweetAlert2) with correct exam answers and all

// View Details modal
window.viewDetails = (resultId) => {
    // ✅ SEARCH IN THE GLOBAL ARRAY
    const result = recentResults.find(r => r.id === resultId);
    
    if (!result) {
        console.error("Result not found:", resultId);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Result not found. Please try again.'
        });
        return;
    }

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
                        <span class="font-medium">Your Answer:</span> 
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
                <!-- Exam Info -->
                <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                    <div class="grid grid-cols-2 gap-4">
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
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                percentage >= 50
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }">
                                ${percentage >= 50 ? 'Passed' : 'Failed'}
                            </span>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Questions</p>
                            <p class="text-sm font-semibold text-slate-900 dark:text-white">${result.totalQuestions} Total</p>
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
        confirmButtonColor: '#2e8ff7',
        customClass: {
            popup: 'overflow-hidden',
            htmlContainer: 'overflow-visible'
        }
    });
};

// Convert timestamp to "x hours/days ago"
function timeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp.toDate(); 
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

// Logout
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

let hamburgerlogBtn = document.getElementById('mobile-logout-btn');
if (hamburgerlogBtn) hamburgerlogBtn.addEventListener('click', dashBoardLogOutBtn);

// Close dropdown on outside click
document.addEventListener('click', e => {
    if (profileBtn && !profileBtn.contains(e.target) && profileDrop && !profileDrop.contains(e.target)) profileDrop.classList.add('hidden');
});



// View All recent activity link on dashboard
const viewAllRecentActivity = document.getElementById('view-all-activity');
if (viewAllRecentActivity) {

    viewAllRecentActivity.addEventListener('click', () => {
   
        Swal.fire({
            title: 'Loading Results...',
            text: 'Redirecting to your result history...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            timer: 800,
            didOpen: () => Swal.showLoading()
        });

        // Redirect to your existing results page
        window.location.href = "./resultHistory.html";
    });
}



