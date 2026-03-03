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

// Load recent activities and fetch exam names
async function loadRecentActivities(userId) {
    const container = document.getElementById('recent-activity-container');
    if (!container) return;

    try {
        const recentQuery = query(
            collection(dataBase, "ExamResults"),
            where("userId", "==", userId),
            orderBy("timestamp", "desc"),
            limit(5)
        );

        const snapshot = await getDocs(recentQuery);
        container.innerHTML = "";

        if (snapshot.empty) {
            container.innerHTML = `<div class="text-center py-12 text-slate-500 dark:text-slate-400">
                <i class="fa-solid fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>No recent activity. Start taking exams to see your progress!</p>
            </div>`;
            return;
        }

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            let examName = "Unnamed Exam";

            // ⚡ Fetch exam document to get name
            if (data.examId) {
                const examDoc = await getDoc(doc(dataBase, "Exams", data.examId));
                if (examDoc.exists()) examName = examDoc.data().title || "Unnamed Exam";
            }

            const score = data.score || 0;
            const status = score >= 50 ? "Passed" : "Failed";
            const time = data.timestamp ? timeAgo(data.timestamp) : "";

            const activityItem = document.createElement('div');
            activityItem.className = "flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm";

            activityItem.innerHTML = `
                <div>
                    <p class="font-medium text-slate-900 dark:text-white">${examName}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${time}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${status === 'Passed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${score}%</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${status}</p>
                </div>
            `;

            container.appendChild(activityItem);
        }

    } catch (err) {
        console.error("Error loading recent activities:", err);
        container.innerHTML = `<div class="text-center py-12 text-red-500"><p>Failed to load recent activity.</p></div>`;
    }
}

// Main onAuthStateChanged - load profile, stats, recent activity
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

        // ---- EXAM STATS ----
        const totalExamsSnap = await getDocs(collection(dataBase, "Exams"));
        updateElementText('totalExams', totalExamsSnap.size);

        const resultsSnap = await getDocs(query(collection(dataBase, "ExamResults"), where("userId", "==", uid)));
        updateElementText('examsTaken', resultsSnap.size);

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

// OTHER BUTTONS (View Result, Update Profile, Logout)

// View result History
const viewResultsBtn = document.getElementById('view-results-btn');
if (viewResultsBtn) {
    viewResultsBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
        Swal.fire({title:'Fetching Result...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
        try {
            const qSnap = await getDocs(query(
                collection(dataBase, "ExamResults"),
                where("userId","==",user.uid),
                orderBy("timestamp","desc"),
                limit(1)
            ));
            Swal.close();
            if (!qSnap.empty) window.location.href = `./resultHistory.html?id=${qSnap.docs[0].id}`;
            else Swal.fire({icon:'info',title:'No Results Found',text:'You haven\'t taken any exams yet.',confirmButtonColor:'#2e8ff7'});
        } catch(err) { console.error(err); Swal.close(); Swal.fire({icon:'error',title:'Error',text:'Failed to load results. Please try again.',confirmButtonColor:'#2e8ff7'}); }
    });
}

// Update profile
const updateProfileBtn = document.getElementById('update-profile-btn');
if (updateProfileBtn) updateProfileBtn.addEventListener('click', () => window.location.href = "./updateProfile.html");

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
    } catch (err) { console.error(err); Swal.fire({icon:"error",title:"Error",text:"Failed to logout. Try again."}); }
}

let dropdownlogBtn = document.getElementById('logout-btn');
if (dropdownlogBtn) dropdownlogBtn.addEventListener('click', dashBoardLogOutBtn);
let hamburgerlogBtn = document.getElementById('mobile-logout-btn');
if (hamburgerlogBtn) hamburgerlogBtn.addEventListener('click', dashBoardLogOutBtn);

// Close dropdown on outside click
document.addEventListener('click', e => {
    if (profileBtn && !profileBtn.contains(e.target) && profileDrop && !profileDrop.contains(e.target)) profileDrop.classList.add('hidden');
});



// View All recent activity on dashboard
// VIEW ALL RESULTS ON DASHBOARD CARD
const viewAllRecentActivity = document.getElementById('view-all-activity');
if (viewAllRecentActivity) {
    viewAllRecentActivity.addEventListener('click', () => {
        // Optional: show a quick loading spinner
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



