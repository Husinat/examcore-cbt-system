     // Dark mode toggle
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

        // Sidebar toggle (mobile)
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const openSidebarBtn = document.getElementById('open-sidebar');
        const closeSidebarBtn = document.getElementById('close-sidebar');

        openSidebarBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('hidden');
        });




// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase config
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
const auth = getAuth(app);
const dataBase = getFirestore(app);

// Helper to safely update text
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}

// Helper to generate initials
function getInitials(fullName) {
    if (!fullName) return "👤";
    const parts = fullName.trim().split(" ");
    return parts[0].charAt(0).toUpperCase() +
           (parts[1] ? parts[1].charAt(0).toUpperCase() : "");
}



// 🔐 ADMIN AUTH GUARD
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    try {
        const userDocRef = doc(dataBase, "users", user.uid); 
        const userSnap = await getDoc(userDocRef);
        

        if (!userSnap.exists()) {
            window.location.href = "../index.html";
            return;
        }

        const userData = userSnap.data();

        if (userData.role !== "admin") {
            alert("Access denied. Admins only.");
            window.location.href = "../StudentPages/dashboard.html";
            return;
        }


//  LOAD TOTAL STUDENTS
async function loadTotalStudents() {
    try {
        const usersRef = collection(dataBase, "users");
        const studentQuery = query(usersRef, where("role", "==", "student"));
        const querySnapshot = await getDocs(studentQuery);

        const totalStudents = querySnapshot.size;

        updateElementText("total-students", totalStudents);

    } catch (error) {
Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: 'Failed to load total students!',
});
console.error("Error loading total students:", error);
    }
}

loadTotalStudents();




// LOAD TOTAL EXAMS
async function loadTotalExams() {
    try {
        const examsRef = collection(dataBase, "Exams");
        const querySnapshot = await getDocs(examsRef);

        const totalExams = querySnapshot.size;

        updateElementText("total-exams", totalExams);

    } catch (error) {
        console.error("Error loading total exams:", error);
        Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: 'Failed to load total exams!',
});
    }
}

loadTotalExams();


// LOAD TOTAL SUBMISSIONS
async function totalSubmission()  {
    try {
     const totalSubRef = collection(dataBase, 'examsCompleted')  ;
     const querySnapshot = await getDocs(totalSubRef);

      const totalSubmissions = querySnapshot.size;
      updateElementText("total-submissions", totalSubmissions)
    } catch (error) {
        console.error("Error loading total exams:", error);
        Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: 'Failed to load total submissions!',
});
        
    }
}    
totalSubmission();



// LOAD AVERAGE SCORE (percentage based)
async function averageScore() {
  try {
    const examResults = collection(dataBase, 'ExamResults');
    const querySnapshot = await getDocs(examResults);

    let totalPercentage = 0;
    let count = 0;

    querySnapshot.forEach((doc) => {
        const data = doc.data();

        if (data.score !== undefined && data.totalQuestions) {
            const percentage = (data.score / data.totalQuestions) * 100;
            totalPercentage += percentage;
            count++;
        }
    });

    let average = 0;
    if (count > 0) {
        average = totalPercentage / count;
    }

    updateElementText("average-score", Math.floor(average));

  } catch (error) {
    console.error("Error calculating average score:", error);
    Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Failed to load average score!',
    });
  }
}
averageScore();

console.log("Admin verified. Loading dashboard...");

// ---- LOAD ADMIN PROFILE ----
const fullName = userData.fullname || "Admin";
const email = userData.email || user.email;
const initials = getInitials(fullName);

// Desktop
updateElementText("admin-name", fullName);
updateElementText("dropdown-admin-name", fullName);
updateElementText("dropdown-admin-email", email);
updateElementText("admin-avatar", initials);

// Mobile
updateElementText("mobile-admin-name", fullName);
updateElementText("mobile-admin-email", email);
updateElementText("mobile-admin-avatar", initials);

    } catch (error) {
        console.error("Error verifying admin:", error);
        // window.location.href = "../index.html";
    }

    
});

// LOAD RECENT SUBMISSIONS
async function loadRecentSubmissions(limit = 5) {
    try {
        const submissionsRef = collection(dataBase, "ExamResults");
        const submissionsSnapshot = await getDocs(submissionsRef);

        let submissions = [];
        submissionsSnapshot.forEach(doc => {
            submissions.push({ id: doc.id, ...doc.data() });
        });

        // 🔥 Sort using Firestore timestamp properly
        submissions.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toDate() - a.timestamp.toDate();
        });

        submissions = submissions.slice(0, limit);

        const tbody = document.getElementById("submissions-table");
        tbody.innerHTML = "";

        for (const sub of submissions) {

            // Get user directly using UID as document ID
            const userSnap = await getDoc(doc(dataBase, "users", sub.userId));
            const examSnap = await getDoc(doc(dataBase, "Exams", sub.examId));

            const userName = userSnap.exists() ? userSnap.data().fullname : "--";
            const examTitle = examSnap.exists() ? examSnap.data().title : "--";

            
            let percentage = "--";
            let scoreClass = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";

            if (sub.score !== undefined && sub.totalQuestions) {
                const calculated = (sub.score / sub.totalQuestions) * 100;
                percentage = Math.round(calculated) + "%";

                if (calculated >= 75) {
                    scoreClass = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
                }
            }

          
            const formattedDate = sub.timestamp
                ? sub.timestamp.toDate().toLocaleDateString()
                : "--";

            const row = document.createElement("tr");
            row.className = "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors";
            row.innerHTML = `
                <td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 dark:text-white break-words">
                    ${userName}
                </td>
                <td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words">
                    ${examTitle}
                </td>
                <td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${scoreClass} whitespace-nowrap">
                        ${percentage}
                    </span>
                </td>
                <td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    ${formattedDate}
                </td>
                <td class="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    <button class="text-brand-600 dark:text-brand-400 hover:underline font-medium whitespace-nowrap">
                        View Details
                    </button>
                </td>
            `;

            tbody.appendChild(row);
        }

    } catch (error) {
        console.error("Error loading recent submissions:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to load recent submissions!',
        });
    }
}
loadRecentSubmissions();