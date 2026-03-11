import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';

import { getFirestore, collection, query, where, orderBy, getDocs, getDoc, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';


//  FIREBASE 
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


//  DARK MODE
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


// GLOBAL PAGINATION 
let allResults = [];
let currentPage = 1;
const pageSize = 5;

const resultsContainer = document.getElementById("results-container");
const loading = document.getElementById('loading-state');
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");


//  AUTH GUARD ==
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    document.getElementById("user-avatar").textContent =
        user.email ? user.email.charAt(0).toUpperCase() : "U";

    fetchResults(user.uid);
});


// FETCH RESULTS
async function fetchResults(uid) {
    try {
        const q = query(
            collection(db, "ExamResults"),
            where("userId", "==", uid),
            orderBy("timestamp", "desc")
        );

        const snapshot = await getDocs(q);

        allResults = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        updatePagination();
        loading.style.display = 'none'; 
        resultsContainer.classList.remove('hidden');

    } catch (error) {
        console.error("Error fetching results:", error);
    }
}


//  DISPLAY RESULTS \
async function displayResults(results) {
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <p class="text-center text-slate-500 dark:text-slate-400">
                You haven't taken any exams yet.
            </p>
        `;
        return;
    }

    for (const result of results) {
        let examName = "Exam";

        // Fetch the exam title if examId exists
        if (result.examId) {
            const examDoc = await getDoc(doc(db, "Exams", result.examId));
            if (examDoc.exists()) {
                examName = examDoc.data().title || "Exam";
            }
        }

        const total = result.totalQuestions || 40;
        const score = result.score || 0;
        const percentage = Math.round((score / total) * 100) || 0;
        const date = result.timestamp ? result.timestamp.toDate() : new Date();

        const card = document.createElement("div");
        card.className =
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md flex justify-between items-center";

        card.innerHTML = `
            <div>
                <h3 class="font-semibold text-slate-900 dark:text-white text-lg">
                    ${examName}
                </h3>

                <p class="text-sm text-slate-500 dark:text-slate-400">
                    Score: ${score} / ${total} (${percentage}%)
                </p>

                <p class="text-xs text-slate-400 dark:text-slate-500">
                    ${date.toLocaleDateString()} • 
                    ${date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </p>
            </div>

            <div class="flex gap-2">
                <button 
                    data-view="${result.id}"
                    class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
                    View
                </button>

                <button 
                    data-delete="${result.id}"
                    class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    Delete
                </button>
            </div>
        `;

        resultsContainer.appendChild(card);

        // VIEW
        card.querySelector("[data-view]").addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-view");
            window.location.href = `./singleResultPage.html?id=${id}`;
        });

        // DELETE
        card.querySelector("[data-delete]").addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-delete");
            const confirmDelete = confirm("Delete this result permanently?");
            if (!confirmDelete) return;

            await deleteDoc(doc(db, "ExamResults", id));
            allResults = allResults.filter(r => r.id !== id);
            updatePagination();
        });
    }
}


// PAGINATION 
function updatePagination() {

    const totalPages = Math.ceil(allResults.length / pageSize);

    if (totalPages === 0) {
        displayResults([]);
        pageInfo.textContent = "Page 0 of 0";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    displayResults(allResults.slice(start, end));

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}


// BUTTON EVENTS 
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
});

nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(allResults.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
    }
});