//  DARK MODE 
const toggleBtn = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('icon-sun');
const moonIcon = document.getElementById('icon-moon');

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    sunIcon?.classList.remove('hidden');
    moonIcon?.classList.add('hidden');
}

toggleBtn?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        sunIcon?.classList.remove('hidden');
        moonIcon?.classList.add('hidden');
    } else {
        localStorage.setItem('theme', 'light');
        sunIcon?.classList.add('hidden');
        moonIcon?.classList.remove('hidden');
    }
});

//  FIREBASE 
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

//  USER AVATAR 
const userAvatar = document.getElementById('user-avatar');
onAuthStateChanged(auth, async (user) => {
    if (!user) return window.location.href = '../index.html';
    userAvatar.textContent = user.email ? user.email.charAt(0).toUpperCase() : 'U';
});
// EXAM TITLE AND EXAM TYPE
const examTitleEl = document.getElementById('examTitle');
const examTypeEl = document.getElementById('examType');

examTitleEl.textContent = "Loading Exam...";
examTypeEl.textContent = "...";

//  EXAM DATA 
let questions = [];
let currentQuestionIndex = 0;
let examTitle = "";

// FETCH EXAM
async function fetchExam() {
    try {
        const params = new URLSearchParams(window.location.search);
        const examId = params.get('id');

        if (!examId) {
            alert('No exam selected! Redirecting...');
            window.location.href = 'availableExams.html';
            return;
        }

        const examSnap = await getDoc(doc(db, "Exams", examId));
        if (!examSnap.exists()) return console.log("No exam found!");

     const examData = examSnap.data();
    examTitle = examData.title || examData.examTitle || examData.name || "Unnamed Exam";
    examTitleEl.textContent = examTitle;
   examTypeEl.textContent = examData.subjectType || "Mixed";

        // Fetch questions
     const q = query(
    collection(db, "Exams", examId, "questions"),
    orderBy("questionNumber")
);

const questionsSnap = await getDocs(q);
        questions = [];
        questionsSnap.forEach(docSnap => {
            questions.push({
                id: docSnap.id,
                selectedOption: null,
                correctAnswer: docSnap.data().correctAnswer || null,
                ...docSnap.data()
            });
        });

        const duration = examData.duration || 0;
        const examTimeEl = document.getElementById('timer-display');
        let remainingTime = duration * 60;

        function displayTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            examTimeEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        displayTime(remainingTime);

        const countdown = setInterval(() => {
            remainingTime--;
            displayTime(remainingTime);
            if (remainingTime <= 0) {
                clearInterval(countdown);
                autoSubmitExam(examId);
            }
        }, 1000);
        document.getElementById("loading-spinner").style.display = "none";
        renderQuestionNavigator();
        displayQuestion();
        updateNavButtons();

    } catch (err) {
        console.error(err);
    }
            console.log(questions);

}

fetchExam();

//  DISPLAYING QUESTION(S)
function displayQuestion() {
    console.log("DISPLAY QUESTION RUNNING");
console.log("CONTAINER ELEMENT:", document.getElementById("question-container"));

    if (!questions.length) return;
    const question = questions[currentQuestionIndex];
    console.log("CURRENT QUESTION:", question);


    const container = document.getElementById("question-container");
    if (!container) {
    console.error("❌ question-container NOT FOUND in HTML");
    return;
}
    document.getElementById("current-question-number").textContent = currentQuestionIndex + 1;
    document.getElementById("total-questions").textContent = questions.length;

    const questionType = question.questionType || "Multiple Choice";
    const iconClass = questionType === "Multiple Choice" ? "fa-list-check" : "fa-pen";

    let optionsHtml = "";
   ["A","B","C","D"].forEach((label,i) => {
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
                  ${question.options[label] || question.options[i]}
                </span>
                ${checkIcon}
            </div>
        </button>
    `;
  console.log("IMAGE URL:", question.imageUrl);
    
});
   

    container.innerHTML = `
        <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-md mb-4">
            <i class="fa-solid ${iconClass}"></i>
            <span>${questionType}</span>
        </div>

         <h4 class="text-sm font-bold text-brand-600 dark:text-brand-400 mb-1">
                         ${question.questionTitle}
                        </h4>
         <p class="text-base text-slate-700 dark:text-slate-300 mb-3 py-5">
                        ${question.passage || ''}
                        </p>

       <div>
               ${question.imageUrl ? `
             <img src="${question.imageUrl}" 
                  class="mb-3 rounded-lg w-full p-10 max-h-[200px] object-contain border">
             ` : ""}
         </div>

        <h2 class="text-base sm:text-lg text-slate-900 dark:text-white leading-relaxed mb-6">
            ${question.questionText}
        </h2>

        <div class="space-y-3" id="answer-options-container">
            ${optionsHtml}
        </div>
    `;
console.log(question.questionText);
    // Option click
    container.querySelectorAll("button[data-option]").forEach(btn => {
        btn.addEventListener("click", () => {
            question.selectedOption = btn.dataset.option;
            displayQuestion();
            updateQuestionNavigator();
        });
    });
}

//  NAV BUTTONS 
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitExamBtn = document.getElementById("submit-exam-btn");

function updateNavButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === questions.length-1;

    prevBtn.classList.toggle('bg-gray-200', prevBtn.disabled);
    prevBtn.classList.toggle('text-gray-400', prevBtn.disabled);
    prevBtn.classList.toggle('cursor-not-allowed', prevBtn.disabled);

    nextBtn.classList.toggle('bg-gray-200', nextBtn.disabled);
    nextBtn.classList.toggle('text-gray-400', nextBtn.disabled);
    nextBtn.classList.toggle('cursor-not-allowed', nextBtn.disabled);
}

prevBtn.addEventListener("click", ()=>{currentQuestionIndex--; displayQuestion(); updateNavButtons(); updateQuestionNavigator();});
nextBtn.addEventListener("click", ()=>{currentQuestionIndex++; displayQuestion(); updateNavButtons(); updateQuestionNavigator();});

//  QUESTION NAV 
function renderQuestionNavigator() {
    const grid = document.getElementById("question-nav-grid");
    grid.innerHTML = "";
    questions.forEach((q,idx)=>{
        const btn = document.createElement("button");
        btn.textContent = idx+1;
        btn.className = `question-nav-btn h-10 border-2 rounded-lg text-sm font-medium transition-colors`;
        if(idx===currentQuestionIndex) btn.classList.add("bg-blue-600","text-white","border-blue-400");
        else btn.classList.add("border-slate-300","dark:border-slate-700","bg-white","dark:bg-slate-900","text-slate-700","dark:text-slate-300");

        btn.addEventListener("click", ()=>{
            currentQuestionIndex=idx; displayQuestion(); updateNavButtons(); updateQuestionNavigator();
        });
        grid.appendChild(btn);
    });
}

function updateQuestionNavigator() {
    const grid = document.getElementById("question-nav-grid");
    Array.from(grid.children).forEach((btn,idx)=>{
        const q = questions[idx];
        btn.className = `question-nav-btn h-10 border-2 rounded-lg text-sm font-medium transition-colors`;
        if(idx===currentQuestionIndex) btn.classList.add("border-brand-600","bg-brand-50");
        else if(q.selectedOption) btn.classList.add("border-transparent","bg-green-600","text-white");
        else btn.classList.add("border-slate-300","dark:border-slate-700","bg-white","dark:bg-slate-900","text-slate-700","dark:text-slate-300");
    });
}

//  SUBMIT EXAM 
async function submitExam() {
    try {
        const unanswered = questions.filter(q=>!q.selectedOption);
        if(unanswered.length>0){
            const proceed = await Swal.fire({
                title:'Some questions are unanswered',
                text:`You have ${unanswered.length} unanswered question(s). Submit anyway?`,
                icon:'warning',
                showCancelButton:true,
                confirmButtonText:'Submit Anyway',
                cancelButtonText:'Go Back'
            });
            if(!proceed.isConfirmed) return;
        }

        let score=0;
        questions.forEach(q=>{
        if(q.selectedOption===q.correctAnswer)
         score++;});
        Swal.fire({title:'Submitting...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
        const percentage = Math.round((score / questions.length) * 100);

        const params = new URLSearchParams(window.location.search);
        const examId = params.get('id');
        const user = auth.currentUser;
        const resultId = `${user.uid}_${examId}`;

        await setDoc(doc(db,"ExamResults",resultId),{
            examId,
            examTitle,
            userId:user.uid,
            score,
            totalQuestions:questions.length,
            percentage,
            timestamp:serverTimestamp(),
            answers:questions.map(q=>({questionId:q.id, selectedOption:q.selectedOption, correctAnswer:q.correctAnswer}))
        });

        await Swal.fire({
            title:'Exam Submitted!',
            html:`You scored <b>${score}</b> out of <b>${questions.length}</b>`,
            icon:'success',
            confirmButtonText:'Go to Result Page'
        });

        window.location.href=`./resultHistory.html?id=${resultId}`;

    } catch(err){console.error(err);Swal.fire({title:'Error',text:'Failed to submit. Try again.',icon:'error'})}
}

submitExamBtn?.addEventListener('click',submitExam);



//  AUTO SUBMIT 
async function autoSubmitExam(examId){
    try{
        let score=0;
         questions.forEach(q=>{
        if(q.selectedOption===q.correctAnswer) 
        score++;
    });
    const percentage = Math.round((score / questions.length) * 100);

        const user = auth.currentUser;
        const resultId = `${user.uid}_${examId}`;
        await setDoc(doc(db,"ExamResults",resultId),{
            examId,
            examTitle,
            userId:user.uid,
            score,
            totalQuestions:questions.length,
            percentage,
            timestamp:serverTimestamp(),
            answers:questions.map(q=>({questionId:q.id,selectedOption:q.selectedOption,correctAnswer:q.correctAnswer}))
        });

        await Swal.fire({title:"Time's up!",html:`Your exam has been submitted automatically.<br>You scored <b>${score}</b> out of <b>${questions.length}</b>.`,icon:'success',confirmButtonText:'Go to Result Page'});
        window.location.href=`./resultHistory.html?id=${resultId}`;

    } catch(err){console.error(err);Swal.fire({title:'Error',text:'Failed to submit exam automatically.',icon:'error'});}
}

//  EXIT EXAM
document.getElementById('exit-exam-btn')?.addEventListener('click',()=>{
    Swal.fire({
    title:'Are you sure?',
    text:"Your progress will not be saved!",
    icon:'warning',
    showCancelButton:true,
    confirmButtonColor:'#2e8ff7',
    cancelButtonColor:'#d33',
    confirmButtonText:'Yes, exit',
    cancelButtonText:'No, stay'})
    .then((result)=>{
    if(result.isConfirmed) window.location.href='./dashboard.html';
    });
});