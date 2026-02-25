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



import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

// User Avatar
const userAvatar = document.getElementById('user-avatar');
onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = '../index.html';
    userAvatar.textContent = user.email ? user.email.charAt(0).toUpperCase() : 'U';
});

// Questions
let questions = [];
let currentQuestionIndex = 0;

// Fetch exam
async function fetchExam() {
    try {
        const params = new URLSearchParams(window.location.search);
        const examId = params.get('id');

        if (!examId) {
            alert('No exam selected! Redirecting to available exams...');
            window.location.href = 'availableExams.html';
            return;
        }
         let examTime = document.getElementById('timer-display')
        const examSnap = await getDoc(doc(db, "Exams", examId));
        if (!examSnap.exists()) {
       console.log("No exam found!");
          return;
        }
      
        const duration = examSnap.data().duration;
        


        // Fetching Questions
        const questionsSnap = await getDocs(collection(db, "Exams", examId, "questions"));
        questions = [];
        questionsSnap.forEach(docSnap => {
            questions.push({
                id: docSnap.id,
                selectedOption: null,
                correctAnswer: docSnap.data().correctAnswer || null, ...docSnap.data()
            });
        });

        document.getElementById("loading-spinner").style.display = "none";
     

        // Timer
        let remainingTime = duration * 60;
        console.log(remainingTime);

        function displayTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            examTime.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        // Show starting time immediately
        displayTime(remainingTime);
        const countdown = setInterval(() => {
            remainingTime--;
            displayTime(remainingTime);

            if (remainingTime <= 0) {
                clearInterval(countdown);
                autoSubmitExam();
            }
        }, 1000);

// Rendering Exam Interface
        renderQuestionNavigator();
        displayQuestion();
        updateNavButtons();

    } catch (err) {
        console.error(err);
    }
}

fetchExam();

// Display a question
function displayQuestion() {
    if (!questions.length) return;
    const question = questions[currentQuestionIndex];
    const container = document.getElementById("question-container");

    document.getElementById("current-question-number").textContent = currentQuestionIndex + 1;
    document.getElementById("total-questions").textContent = questions.length;

    const iconClass = question.questionType === "multiple" ? "fa-list-check" : "fa-pen";

    let optionsHtml = "";
    ["A", "B", "C", "D"].forEach((label, i) => {
        const isSelected = question.selectedOption === label;
        const borderClass = isSelected ? "border-brand-600 dark:border-brand-500" : "border-slate-300 dark:border-slate-700";
        const bgClass = isSelected ? "bg-brand-50 dark:bg-brand-900/20" : "bg-white dark:bg-slate-900";
        const checkIcon = isSelected ? `<i class="fa-solid fa-circle-check text-brand-600 dark:text-brand-400"></i>` : "";

        optionsHtml += `
            <button class="answer-option w-full text-left p-4 border-2 ${borderClass} ${bgClass} rounded-lg hover:border-brand-400 transition-colors"
                data-option="${label}">
                <div class="flex items-center gap-3">
                    <span class="flex-shrink-0 w-8 h-8 rounded-full ${isSelected ? 'bg-brand-600 dark:bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'} flex items-center justify-center font-bold text-sm">
                        ${label}
                    </span>
                    <span class="flex-1 text-sm sm:text-base ${isSelected ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-800 dark:text-slate-200'}">
                        ${question.options[i]}
                    </span>
                    ${checkIcon}
                </div>
            </button>
        `;
    });

    container.innerHTML = `
        <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md mb-4">
            <i class="fa-solid ${iconClass}"></i>
            <span>${question.questionType}</span>
        </div>

        <h2 class="text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed mb-6">
            ${question.questionText}
        </h2>

        <div class="space-y-3" id="answer-options-container">
            ${optionsHtml}
        </div>
    `;

    // Click to select
    container.querySelectorAll("button[data-option]").forEach(btn => {
        btn.addEventListener("click", () => {
            question.selectedOption = btn.dataset.option;
            displayQuestion();
            updateQuestionNavigator();
        });
    });
}

// Next / Previous / Submit buttons
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitExamBtn = document.getElementById("submit-exam-btn");

function updateNavButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === questions.length - 1;

    prevBtn.classList.toggle('bg-gray-200', prevBtn.disabled);
    prevBtn.classList.toggle('text-gray-400', prevBtn.disabled);
    prevBtn.classList.toggle('cursor-not-allowed', prevBtn.disabled);

    nextBtn.classList.toggle('bg-gray-200', nextBtn.disabled);
    nextBtn.classList.toggle('text-gray-400', nextBtn.disabled);
    nextBtn.classList.toggle('cursor-not-allowed', nextBtn.disabled);
}

prevBtn.addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateNavButtons();
        updateQuestionNavigator();
    }
});
nextBtn.addEventListener("click", () => {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateNavButtons();
        updateQuestionNavigator();
    }
});

// Question navigator grid
function renderQuestionNavigator() {
    const grid = document.getElementById("question-nav-grid");
    grid.innerHTML = "";

    questions.forEach((q, idx) => {
        const btn = document.createElement("button");
        btn.textContent = idx + 1;
        btn.className = `question-nav-btn h-10 border-2 rounded-lg text-sm font-medium transition-colors`;

        // Replace your existing 'if (idx === currentQuestionIndex)' line with this:
        if (idx === currentQuestionIndex) {
            btn.classList.add(
                "bg-blue-600",
                "text-white",
                "border-blue-400"
            );
        } else{
btn.classList.add("border-slate-300", "dark:border-slate-700", "bg-white", "dark:bg-slate-900", "text-slate-700", "dark:text-slate-300");
        } 

        btn.addEventListener("click", () => {
            currentQuestionIndex = idx;
            displayQuestion();
            updateNavButtons();
            updateQuestionNavigator();
        });

        grid.appendChild(btn);
    });
}

function updateQuestionNavigator() {
    const grid = document.getElementById("question-nav-grid");
    Array.from(grid.children).forEach((btn, idx) => {
        const q = questions[idx];
        btn.className = `question-nav-btn h-10 border-2 rounded-lg text-sm font-medium transition-colors`;
        if (idx === currentQuestionIndex) btn.classList.add("border-brand-600", "bg-brand-50");
        else if (q.selectedOption) btn.classList.add("border-transparent", "bg-green-600", "text-white");
        else btn.classList.add("border-slate-300", "dark:border-slate-700", "bg-white", "dark:bg-slate-900", "text-slate-700", "dark:text-slate-300");
    });
}






// CREATING EXAM QUESTIONS AND PUSHING TO FIREBASE AND BACK
const questionsData = {
    q1: {
        questionNumber: 1,
        questionText: "Choose the word that is nearest in meaning to the capitalized word in the sentence below: The manager was RELUCTANT to approve the proposal",
        questionType: "Multiple Choice",
        options: ["Eager", "Unwilling", "Careless", "supportive"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "English"
    },

    q2: {
        questionNumber: 2,
        questionText: "Solve for x: 2x + 5 = 13.",
        questionType: "Multiple Choice",
        options: ["3", "4", "5", "6"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q3: {
        questionNumber: 3,
        questionText: "Which gas is essential for photosynthesis?",
        questionType: "Multiple Choice",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q4: {
        questionNumber: 4,
        questionText: "What is the chemical formula of water?",
        questionType: "Multiple Choice",
        options: ["H2O", "CO2", "NaCl", "O2"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q5: {
        questionNumber: 5,
        questionText: "Choose the word nearest in meaning to 'ABUNDANT'.",
        questionType: "Multiple Choice",
        options: ["Plentiful", "Scarce", "Rare", "Limited"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "English"
    },
    q6: {
        questionNumber: 6,
        questionText: "If y = 3x + 7, find y when x = 5.",
        questionType: "Multiple Choice",
        options: ["15", "22", "19", "20"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q7: {
        questionNumber: 7,
        questionText: "Which part of the cell contains the genetic material?",
        questionType: "Multiple Choice",
        options: ["Nucleus", "Mitochondria", "Cytoplasm", "Ribosome"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q8: {
        questionNumber: 8,
        questionText: "The process of converting a solid directly to a gas is called?",
        questionType: "Multiple Choice",
        options: ["Condensation", "Sublimation", "Evaporation", "Melting"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q9: {
        questionNumber: 9,
        questionText: "Choose the antonym of 'BENEVOLENT'.",
        questionType: "Multiple Choice",
        options: ["Kind", "Cruel", "Generous", "Friendly"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "English"
    },
    q10: {
        questionNumber: 10,
        questionText: "If a train travels 60 km in 1.5 hours, its speed is?",
        questionType: "Multiple Choice",
        options: ["30 km/h", "40 km/h", "45 km/h", "50 km/h"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Physics"
    },
    q11: {
        questionNumber: 11,
        questionText: "Which element has the atomic number 6?",
        questionType: "Multiple Choice",
        options: ["Oxygen", "Carbon", "Nitrogen", "Hydrogen"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q12: {
        questionNumber: 12,
        questionText: "The formula for calculating the area of a triangle is?",
        questionType: "Multiple Choice",
        options: ["½ × base × height", "base × height", "base + height", "base² × height"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q13: {
        questionNumber: 13,
        questionText: "Which organelle is responsible for energy production?",
        questionType: "Multiple Choice",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q14: {
        questionNumber: 14,
        questionText: "The pH of a neutral solution is?",
        questionType: "Multiple Choice",
        options: ["0", "7", "14", "1"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q15: {
        questionNumber: 15,
        questionText: "Choose the word nearest in meaning to 'CANDID'.",
        questionType: "Multiple Choice",
        options: ["Honest", "Deceptive", "Shy", "Silent"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "English"
    },
    q16: {
        questionNumber: 16,
        questionText: "A car accelerates from 0 to 20 m/s in 5 seconds. Its acceleration is?",
        questionType: "Multiple Choice",
        options: ["2 m/s²", "4 m/s²", "5 m/s²", "3 m/s²"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Physics"
    },
    q17: {
        questionNumber: 17,
        questionText: "Which compound is common table salt?",
        questionType: "Multiple Choice",
        options: ["NaCl", "KCl", "Na2SO4", "CaCl2"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q18: {
        questionNumber: 18,
        questionText: "Simplify: 5x + 3x - 4.",
        questionType: "Multiple Choice",
        options: ["8x - 4", "2x - 4", "15x - 4", "8x + 4"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q19: {
        questionNumber: 19,
        questionText: "Which blood cells help fight infections?",
        questionType: "Multiple Choice",
        options: ["Red blood cells", "White blood cells", "Platelets", "Plasma"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q20: {
        questionNumber: 20,
        questionText: "The boiling point of water at standard pressure is?",
        questionType: "Multiple Choice",
        options: ["90°C", "100°C", "110°C", "120°C"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q21: {
        questionNumber: 21,
        questionText: "Choose the word nearest in meaning to 'IMMINENT'.",
        questionType: "Multiple Choice",
        options: ["Likely", "Distant", "Rare", "Uncertain"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "English"
    },
    q22: {
        questionNumber: 22,
        questionText: "If a body covers 100 m in 10 s, its speed is?",
        questionType: "Multiple Choice",
        options: ["10 m/s", "15 m/s", "12 m/s", "20 m/s"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Physics"
    },
    q23: {
        questionNumber: 23,
        questionText: "Which gas do humans exhale?",
        questionType: "Multiple Choice",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctAnswer: "C",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q24: {
        questionNumber: 24,
        questionText: "Solve for x: x² - 9 = 0.",
        questionType: "Multiple Choice",
        options: ["x = ±3", "x = 3", "x = 0", "x = ±9"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q25: {
        questionNumber: 25,
        questionText: "Choose the antonym of 'MELANCHOLY'.",
        questionType: "Multiple Choice",
        options: ["Sad", "Cheerful", "Angry", "Lonely"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "English"
    },
    q26: {
        questionNumber: 26,
        questionText: "Which of these is a renewable source of energy?",
        questionType: "Multiple Choice",
        options: ["Coal", "Petrol", "Solar", "Natural Gas"],
        correctAnswer: "C",
        selectedOption: null,
        subjectArea: "Physics"
    },
    q27: {
        questionNumber: 27,
        questionText: "Which part of the plant conducts photosynthesis?",
        questionType: "Multiple Choice",
        options: ["Root", "Leaf", "Stem", "Flower"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q28: {
        questionNumber: 28,
        questionText: "The chemical symbol for Sodium is?",
        questionType: "Multiple Choice",
        options: ["Na", "S", "K", "So"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q29: {
        questionNumber: 29,
        questionText: "Solve: 7 × 8 - 10.",
        questionType: "Multiple Choice",
        options: ["46", "50", "45", "48"],
        correctAnswer: "C",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q30: {
        questionNumber: 30,
        questionText: "Choose the word nearest in meaning to 'OBSTINATE'.",
        questionType: "Multiple Choice",
        options: ["Stubborn", "Flexible", "Gentle", "Soft"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "English"
    },
    q31: {
        questionNumber: 31,
        questionText: "The acceleration due to gravity on Earth is approximately?",
        questionType: "Multiple Choice",
        options: ["9.8 m/s²", "10 m/s²", "8.5 m/s²", "9 m/s²"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Physics"
    },
    q32: {
        questionNumber: 32,
        questionText: "Which organelle synthesizes proteins?",
        questionType: "Multiple Choice",
        options: ["Mitochondria", "Ribosome", "Nucleus", "Golgi body"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Biology"
    },
    q33: {
        questionNumber: 33,
        questionText: "Which of these is an acid?",
        questionType: "Multiple Choice",
        options: ["NaOH", "HCl", "KOH", "Ca(OH)2"],
        correctAnswer: "B",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q34: {
        questionNumber: 34,
        questionText: "Simplify: 9x - 4x + 7.",
        questionType: "Multiple Choice",
        options: ["5x + 7", "13x + 7", "5x - 7", "9x + 7"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q35: {
        questionNumber: 35,
        questionText: "Choose the antonym of 'TRANSPARENT'.",
        questionType: "Multiple Choice",
        options: ["Opaque", "Clear", "Visible", "Lucid"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "English"
    },
    q36: {
        questionNumber: 36,
        questionText: "A body moves with uniform velocity. Its acceleration is?",
        questionType: "Multiple Choice",
        options: ["Zero", "Constant", "Increasing", "Decreasing"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Physics"
    },
    q37: {
        questionNumber: 37,
        questionText: "Which element is a noble gas?",
        questionType: "Multiple Choice",
        options: ["Helium", "Hydrogen", "Oxygen", "Nitrogen"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "Chemistry"
    },
    q38: {
        questionNumber: 38,
        questionText: "Solve for x: 3x - 7 = 11.",
        questionType: "Multiple Choice",
        options: ["6", "5", "7", "8"],
        correctAnswer: "D",
        selectedOption: null,
        subjectArea: "Mathematics"
    },
    q39: {
        questionNumber: 39,
        questionText: "Choose the word nearest in meaning to 'IMPARTIAL'.",
        questionType: "Multiple Choice",
        options: ["Fair", "Biased", "Partial", "Unjust"],
        correctAnswer: "A",
        selectedOption: null,
        subjectArea: "English"
    },
    q40: {
        questionNumber: 40,
        questionText: "Which law states that for every action, there is an equal and opposite reaction?",
        questionType: "Multiple Choice",
        options: ["Newton’s First Law", "Newton’s Second Law", "Newton’s Third Law", "Law of Inertia"],
        correctAnswer: "C",
        selectedOption: null,
        subjectArea: "Physics"
    }
};

async function addQuestions(examId) {
    for (const key in questionsData) {
        const questionRef = doc(db, "Exams", examId, "questions", key);
        await setDoc(questionRef, questionsData[key]);
    }
    console.log("All questions added!");
}








// SUBMIT BTN
async function submitExam() {
    try {

        const unanswered = questions.filter(q => !q.selectedOption);
        if (unanswered.length > 0) {
            const proceed = await Swal.fire({
                title: 'Some questions are unanswered',
                text: `You have ${unanswered.length} unanswered question(s). Do you want to submit anyway?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Submit Anyway',
                cancelButtonText: 'Go Back'
            });
            if (!proceed.isConfirmed) return;
        }

        let score = 0;
        questions.forEach(q => {
            if (q.selectedOption === q.correctAnswer) {
                score++;
            }
        });


        const params = new URLSearchParams(window.location.search);
        const examId = params.get('id');
        const user = auth.currentUser;
        if (!user || !examId) throw new Error("User or Exam ID missing");

        await setDoc(doc(db, "ExamResults", `${user.uid}_${examId}`), {
            examId: examId,
            userId: user.uid,
            score: score,
            totalQuestions: questions.length,
            timestamp: serverTimestamp(),
            answers: questions.map(q => ({
                questionId: q.id,
                selectedOption: q.selectedOption,
                correctAnswer: q.correctAnswer
            }))
        });


        await Swal.fire({
            title: 'Exam Submitted!',
            html: `You scored <b>${score}</b> out of <b>${questions.length}</b>`,
            icon: 'success',
            confirmButtonText: 'Go to Dashboard'
        });


        window.location.href = './dashboard.html';

    } catch (error) {
        console.error("Error submitting exam:", error);
        Swal.fire({
            title: 'Submission Failed',
            text: 'Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }

}

submitExamBtn.addEventListener("click", submitExam);


        // AUTO SUBMIT EXAM
// AUTO SUBMIT EXAM (polished)
async function autoSubmitExam() {
    try {
        // Calculate score
        let score = 0;
        questions.forEach(q => {
            if (q.selectedOption === q.correctAnswer) score++;
        });

        const params = new URLSearchParams(window.location.search);
        const examId = params.get('id');
        const user = auth.currentUser;
        if (!user || !examId) throw new Error("User or Exam ID missing");

        // Store exam result in Firestore
        await setDoc(doc(db, "ExamResults", `${user.uid}_${examId}`), {
            examId: examId,
            userId: user.uid,
            score: score,
            totalQuestions: questions.length,
            timestamp: serverTimestamp(),
            answers: questions.map(q => ({
                questionId: q.id,
                selectedOption: q.selectedOption,
                correctAnswer: q.correctAnswer
            }))
        });

        // Inform user
        await Swal.fire({
            title: "Time's up!",
            html: `Your exam has been submitted automatically.<br>
                   You scored <b>${score}</b> out of <b>${questions.length}</b>.`,
            icon: 'success',
            confirmButtonText: 'Go to Dashboard'
        });

        // Redirect
        window.location.href = './dashboard.html';

    } catch (error) {
        console.error("Error submitting exam:", error);
        Swal.fire({
            title: 'Submission Failed',
            text: 'Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}









// EXIT EXAM BTN
let exitBtn = document.getElementById('exit-exam-btn');

exitBtn.addEventListener('click', function () {
    Swal.fire({
        title: 'Are you sure?',
        text: "Your progress will not be saved if you exit!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2e8ff7', // your brand color
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, exit',
        cancelButtonText: 'No, stay'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = './dashboard.html';
        }
    });
});