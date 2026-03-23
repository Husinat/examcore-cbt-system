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




// FIREBASE IMPORTS
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';


// FIREBASE CONFIG 
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


// GETTING EXAM ID FROM URL
const urlParams = new URLSearchParams(window.location.search);
const examId = urlParams.get('examId');
console.log(examId);


if (!examId) {
    Swal.fire({
        title: 'Error',
        text: 'No exam ID provided!',
        icon: 'error',
        confirmButtonText: 'Go Back'
    }).then(() => {
        window.location.href = './manage-exams.html';
    });
}




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



    } catch (err) {
        console.error("Error checking admin status:", err);
    }
});





// STATE VARIABLES
let questions = [];
let examData = null;

// UI ELEMENTS
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const questionsList = document.getElementById('questions-list');
const examTitle = document.getElementById('exam-title');


// SHOW/HIDE STATES
function showLoading() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    questionsList.classList.add('hidden');
}

function showEmpty() {
    loadingState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    errorState.classList.add('hidden');
    questionsList.classList.add('hidden');
}

function showError() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.remove('hidden');
    questionsList.classList.add('hidden');
}

function showQuestions() {
    loadingState.classList.add('hidden');
    emptyState.classList.add('hidden');
    errorState.classList.add('hidden');
    questionsList.classList.remove('hidden');
}


// FETCH EXAM DETAILS
async function fetchExamDetails() {
    try {
        const examRef = doc(db, 'Exams', examId);
        const examSnap = await getDoc(examRef);

        if (!examSnap.exists()) {
            throw new Error('Exam not found');
        }

        examData = examSnap.data();
        examTitle.textContent = examData.title || 'Untitled Exam';

    } catch (error) {
        console.error('Error fetching exam:', error);
        examTitle.textContent = 'Error Loading Exam';
    }
}

// FETCH QUESTIONS FROM FIRESTORE
async function fetchQuestions() {
    showLoading();

    try {
        await fetchExamDetails();

        const questionsRef = collection(db, 'Exams', examId, 'questions');
        const questionsSnap = await getDocs(questionsRef);

        questions = [];
        questionsSnap.forEach(docSnap => {
            questions.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        questions.sort((a, b) => a.questionNumber - b.questionNumber);
        if (questions.length === 0) {
            showEmpty();
        } else {
            renderQuestions();
            showQuestions();
        }
        console.log(questions);


    } catch (error) {
        console.error('Error fetching questions:', error);
        showError();
    }
}


// RENDER QUESTIONS
function renderQuestions() {
    questionsList.innerHTML = '';

    questions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'fade-in bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow';

        questionCard.innerHTML = `
                    <!-- Gradient Accent -->
                    <div class="h-2 bg-gradient-to-r from-brand-500 to-brand-600"></div>

                    <div class="p-6">
                        <!-- Question Header -->
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                                    <span class="text-brand-600 dark:text-brand-400 font-bold">${index + 1}</span>
                                </div>
                                <div>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Question ${index + 1}</p>
                                    <p class="text-sm text-slate-600 dark:text-slate-400">
                                        <i class="fa-solid fa-circle-check text-green-600 dark:text-green-400 mr-1"></i>
                                        Correct: ${question.correctAnswer}
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div class="flex items-center gap-2">
                                <button onclick="editQuestion('${question.id}')" class="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-all" title="Edit">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button onclick="deleteQuestion('${question.id}')" class="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:border-red-400 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all" title="Delete">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Question Text -->
                       <h4 class="text-sm font-bold text-brand-600 dark:text-brand-400 mb-1">
                        ${question.questionTitle}
                        </h4>

                           <p class="text-base text-slate-700 dark:text-slate-300 mb-3">
                        ${question.passage}
                        </p>

                        <h1 class="text-base text-slate-700 dark:text-slate-300 mb-3">
                        ${question.questionText}
                        </h1>
                     

                        <!-- Options -->
                  <!-- Options -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
${Object.entries(question.options || {}).map(([key, option]) => `
    <div 
        class="option-card p-3 rounded-xl border border-slate-200 dark:border-slate-700 
        bg-slate-50 dark:bg-slate-800 cursor-pointer hover:border-brand-500 transition"
        data-question="${question.id}"
        data-option="${key}">
        <strong>${key}.</strong> ${option}
    </div>
`).join("")}
</div>
                `;
        questionsList.appendChild(questionCard);
    });
}



// ADD QUESTION
document.getElementById('add-question-btn').addEventListener('click', async () => {
    const { value: formValues } = await Swal.fire({
        title: 'Add New Question',
        width: '90%',
        maxWidth: '600px',
        html: `
            <div class="text-left space-y-3 max-w-full overflow-hidden">
               <div>
                    <label class="block text-sm font-[400] text-slate-700 dark:text-slate-300 mb-2">Question Title</label>
                    <textarea id="swal-questionTitle" class="w-full px-3 py-1 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" rows="3" placeholder="Enter question title"></textarea>
                </div>

                <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"> Passage (Optional)</label>
    <textarea id="swal-passage" class="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"rows="4"placeholder="Enter comprehension passage (for English or theory questions)">
    </textarea>
</div>



                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Text</label>
                    <textarea id="swal-question" class="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" rows="3" placeholder="Enter question text"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option A</label>
                    <input id="swal-option-a" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Option A">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option B</label>
                    <input id="swal-option-b" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Option B">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option C</label>
                    <input id="swal-option-c" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Option C">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option D</label>
                    <input id="swal-option-d" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Option D">
                </div>
                <div>
                    <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correct Answer</label>
                    <select id="swal-correct" class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                        <option value="">Select correct answer</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                    </select>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Add Question',
        cancelButtonText: 'Cancel',
        customClass: {
            popup: 'overflow-hidden',
            htmlContainer: 'overflow-y-auto max-h-96'
        },
        preConfirm: () => {
            const questionTitle = document.getElementById('swal-questionTitle').value;
            const question = document.getElementById('swal-question').value;
            const optionA = document.getElementById('swal-option-a').value;
            const optionB = document.getElementById('swal-option-b').value;
            const optionC = document.getElementById('swal-option-c').value;
            const optionD = document.getElementById('swal-option-d').value;
            const correct = document.getElementById('swal-correct').value;
            const passage = document.getElementById('swal-passage').value;

        if (!questionTitle || !question || !optionA || !optionB || !optionC || !optionD || !correct) {
                // Swal.showValidationMessage('All fields are required');
                return false;
            }

            return { questionTitle, question, optionA, optionB, optionC, optionD, correct, passage };
        }
    });

    if (formValues) {
        try {
            const questionsRef = collection(db, 'Exams', examId, 'questions');
            await addDoc(questionsRef, {
                questionNumber: questions.length + 1,
                questionTitle: formValues.questionTitle,
                passage: formValues.passage || null,
                questionText: formValues.question,
                options: {
                    A: formValues.optionA,
                    B: formValues.optionB,
                    C: formValues.optionC,
                    D: formValues.optionD
                },
                correctAnswer: formValues.correct,
                createdAt: serverTimestamp(),
            });


            await Swal.fire({
                icon: "success",
                title: "Question Added!",
                text: "Question added successfully",
                timer: 2000,
                showConfirmButton: false
            });

            // Reload questions
            fetchQuestions();

        } catch (error) {
            console.error('Error adding question:', error);
            Swal.fire('Error', 'Failed to add question', 'error');
        }
    }
});

// EDIT QUESTION
window.editQuestion = async (questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const { value: formValues } = await Swal.fire({
        title: 'Edit Question',
        html: `
                    <div class="text-left space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Title</label>
                            <textarea id="swal-questionTitle" class="swal2-input w-full" rows="3">${question.questionTitle}</textarea>
                        </div>

                            <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Passage</label>
                            <textarea id="swal-passage" class="swal2-input w-full" rows="3">${question.passage || ''}</textarea>
                        </div>

                            <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Question Text</label>
                            <textarea id="swal-questionText" class="swal2-input w-full" rows="3">${question.questionText}</textarea>
                        </div>


                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option A</label>
                            <input id="swal-option-a" class="swal2-input w-full" value="${question.options.A}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option B</label>
                            <input id="swal-option-b" class="swal2-input w-full" value="${question.options.B}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option C</label>
                            <input id="swal-option-c" class="swal2-input w-full" value="${question.options.C}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Option D</label>
                            <input id="swal-option-d" class="swal2-input w-full" value="${question.options.D}">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correct Answer</label>
                            <select id="swal-correct" class="swal2-input w-full">
                                <option value="A" ${question.correctAnswer === 'A' ? 'selected' : ''}>A</option>
                                <option value="B" ${question.correctAnswer === 'B' ? 'selected' : ''}>B</option>
                                <option value="C" ${question.correctAnswer === 'C' ? 'selected' : ''}>C</option>
                                <option value="D" ${question.correctAnswer === 'D' ? 'selected' : ''}>D</option>
                            </select>
                        </div>
                    </div>
                `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Update Question',
        cancelButtonText: 'Cancel',
        preConfirm: () => {
            return {
            questionTitle: document.getElementById('swal-questionTitle').value,
        passage: document.getElementById('swal-passage').value,
        questionText: document.getElementById('swal-questionText').value,
        optionA: document.getElementById('swal-option-a').value,
        optionB: document.getElementById('swal-option-b').value,
        optionC: document.getElementById('swal-option-c').value,
        optionD: document.getElementById('swal-option-d').value,
        correct: document.getElementById('swal-correct').value
            };
        }
    });


    if (formValues) {
        try {
            const questionRef = doc(db, 'Exams', examId, 'questions', questionId);
          await updateDoc(questionRef, {
    questionTitle: formValues.questionTitle,
    passage: formValues.passage,
    questionText: formValues.questionText,
    options: {
        A: formValues.optionA,
        B: formValues.optionB,
        C: formValues.optionC,
        D: formValues.optionD
    },
    correctAnswer: formValues.correct
});

            Swal.fire({
                title: 'Updated!',
                text: 'Question updated successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            fetchQuestions();

        } catch (error) {
            console.error('Error updating question:', error);
            Swal.fire('Error', 'Failed to update question', 'error');
        }
    }
};

// DELETE QUESTION
window.deleteQuestion = async (questionId) => {
    const result = await Swal.fire({
        title: 'Delete Question?',
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, Delete',
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        try {
            await deleteDoc(doc(db, 'Exams', examId, 'questions', questionId));

            Swal.fire({
                title: 'Deleted!',
                text: 'Question removed successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            fetchQuestions();

        } catch (error) {
            console.error('Error deleting question:', error);
            Swal.fire('Error', 'Failed to delete question', 'error');
        }
    }
};

document.addEventListener("click", (e) => {

    if (!e.target.classList.contains("option-card")) return;

    const selected = e.target;
    const container = selected.parentElement;

    // remove previous selection
    container.querySelectorAll(".option-card").forEach(opt => {
        opt.classList.remove("bg-green-100", "border-green-500");
    });

    // add selection style
    selected.classList.add("bg-green-100", "border-green-500");

});
// ========================================
// RETRY BUTTON
// ========================================
// document.getElementById('retry-btn').addEventListener('click', fetchQuestions);

// ========================================
// INITIALIZE
// ========================================
fetchQuestions();