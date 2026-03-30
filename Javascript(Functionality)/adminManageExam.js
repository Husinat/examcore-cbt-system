   // DARK MODE TOGGLE
     
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



import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDocs, getDoc, collection, addDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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
const db = getFirestore(app);


const logoLink = document.getElementById("logoLink");
logoLink.addEventListener('click', e => {
  e.preventDefault();
});
logoLink.classList.toggle('cursor-not-allowed', true);


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

// Dropdown Menu
const adminAvatar = document.getElementById('admin-avatar');
adminAvatar.addEventListener('click', e => {
const dropdown = document.getElementById('admin-dropdown');
if (dropdown){
    dropdown.classList.toggle('hidden');
}
});

// Close dropdown on outside click
document.addEventListener('click', e => {
    if (adminAvatar && !adminAvatar.contains(e.target)) {
        const dropDown = document.getElementById('admin-dropdown');
        if (dropDown) {
            dropDown.classList.add('hidden');
        }
    }
});




// ADMIN AUTH GUARD
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
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






const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const examsGrid = document.getElementById('exams-grid');



// FETCHING EXAMS FRM FIRESTORE
async function getExamFromFireStore () {
     try {
        const examsSnap = await getDocs(collection(db, 'Exams'));
        const exams = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return exams;
    } catch (err) {
        console.error("Error fetching exams:", err);
        return [];
    }
    
}


function renderExams(exams) {
    if (!exams.length) {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        examsGrid.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    loadingState.classList.add('hidden');
    examsGrid.classList.remove('hidden');
    examsGrid.innerHTML = '';

    exams.forEach(exam => {
        const card = document.createElement('div');
        card.className = 'exam-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all';
        card.innerHTML = `
            <div class="h-2 bg-gradient-to-r from-brand-500 to-brand-600"></div>
            <div class="p-6">
                <h3 class="text-xl font-serif text-slate-900 dark:text-white mb-4 line-clamp-2">${exam.title}</h3>
                <div class="flex flex-wrap gap-2 mb-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        <i class="fa-solid fa-book-open mr-1.5"></i> ${exam.subject || 'N/A'}
                    </span>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <i class="fa-solid fa-clock mr-1.5"></i> ${exam.duration || '0'} mins
                    </span>
                </div>
                <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
                    <i class="fa-solid fa-list-check"></i>
                    <span>${exam.totalQuestions || 0} Questions</span>
                </div>
                <div class="flex gap-3">
                    <a href="./adminAddQuestionPage.html?examId=${exam.id}" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors">
                        <i class="fa-solid fa-pen-to-square"></i>
                        <span>Manage Questions</span>
                    </a>
                    <button data-id="${exam.id}" class="delete-exam-btn w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 hover:bg-red-600 text-red-600 hover:text-white rounded-xl transition-all">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        examsGrid.appendChild(card);
    });

    // Add delete functionality
    document.querySelectorAll('.delete-exam-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const examId = btn.dataset.id;
            const confirm = await Swal.fire({
                title: 'Delete Exam?',
                text: 'This cannot be undone!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Yes, Delete'
            });
            if (confirm.isConfirmed) {
                await deleteDoc(doc(db, 'Exams', examId));
                Swal.fire('Deleted!', 'Exam removed successfully', 'success');
                loadExams();
            }
        });
    });
}

const pageLoader = document.getElementById('page-loader');

async function loadExams() {
    // Ensure loader shows immediately
    pageLoader.classList.remove('hidden');

    loadingState.classList.remove('hidden');
    examsGrid.classList.add('hidden');
    emptyState.classList.add('hidden');

    const exams = await getExamFromFireStore();

    renderExams(exams);

    // Hide the page loader
    pageLoader.classList.add('hidden');
}
loadExams();

// Retry button
document.getElementById('retry-btn')?.addEventListener('click', () => {
pageLoader;
});




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
