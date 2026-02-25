// Theme Switcher (Light and Dark Mode) & remembering theme preference on reload
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




// Profile & hamburger Dropdown
let profileDrop = document.getElementById('profile-dropdown');
let profileBtn = document.getElementById('profile-btn');

profileBtn.addEventListener('click', () => {
    profileDrop.classList.toggle('hidden');
})

let hamburgerBtn = document.getElementById('mobile-menu-btn');
let mobileMenu = document.getElementById('mobile-menu');
let openIcon = document.getElementById('hamburger-icon')
let closeIcon = document.getElementById('close-icon');

hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    openIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
});






//  Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";


// Your web app's Firebase configuration
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


// Authentication Guard
onAuthStateChanged(auth, async (loggedInUser) => {
    if (!loggedInUser) {
        window.location.href = "./../index.html";
        return;
    }

    console.log("User is logged in:", loggedInUser.email);


    // Updating student's username, email, and avatar based on their existing info

    const uid = loggedInUser.uid;
    const userDocRef = doc(dataBase, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
        const userData = userSnap.data();


        document.getElementById('welcome-name').textContent = userData.fullname;
        document.getElementById('user-name').textContent = userData.fullname;
        document.getElementById('dropdown-user-name').textContent = userData.fullname || "Student";
        const fullName = userData.fullname
        const nameParts = fullName.trim().split(" ");

        let initials = nameParts[0].charAt(0).toUpperCase();

        if (nameParts.length > 1) {
            initials += nameParts[1].charAt(0).toUpperCase();
        }
        document.getElementById('user-avatar').textContent = initials;


        document.getElementById('dropdown-user-email').textContent = userData.email;
        document.getElementById('mobile-user-name').textContent = userData.fullname || "Student";
        document.getElementById('mobile-user-email').textContent = userData.email;
        document.getElementById('mobile-user-avatar').textContent = userData.fullname?.charAt(0) + userData.fullname?.split(' ')[1]?.charAt(0) || "JD";


        // UPDATING AND REAVELING UI AFTER AUTHENTICATION 
        document.getElementById('userInfoContainer').classList.remove('invisible');
        document.getElementById('welcome-name').classList.remove('invisible');
        document.getElementById('mobileMenu').classList.remove('invisible');

    }







    // IMPORTING EXAMS FROM FIRESTORE(For Available Exams Part)
    const examCollectionRef = collection(dataBase, 'Exams');

    const examSnapshot = await getDocs(examCollectionRef);

    const totalExams = examSnapshot.size;
    console.log(totalExams);


    document.getElementById('totalExams').classList.remove('invisible');
    document.getElementById('totalExams').textContent = totalExams;

    
const resultsQuery = query(
    collection(dataBase, 'ExamResults'),
    where("userId", "==", loggedInUser.uid)
);

const resultsSnapshot = await getDocs(resultsQuery);


    //  EXAMS COMPLETED
const examsTaken = resultsSnapshot.size;

document.getElementById('examsTaken').textContent = examsTaken;
document.getElementById('examsTaken').classList.remove('invisible');



    // AVERAGE SCORE
let totalScore = 0;

resultsSnapshot.forEach(doc => {
    totalScore += Number(doc.data().score);
});

let averageScore = 0;

if (resultsSnapshot.size > 0) {
    averageScore = Math.round(totalScore / resultsSnapshot.size);
}

document.getElementById('averageScore').textContent = averageScore + '%';
document.getElementById('averageScore').classList.remove('invisible');




 
    // LAST EXAM SCORE
const lastExamQuery = query(
    collection(dataBase, 'ExamResults'),
    where("userId", "==", loggedInUser.uid),
    orderBy("timestamp", "desc"),
    limit(1)
);

const lastExamSnapshot = await getDocs(lastExamQuery);

let lastScore = 0;

if (!lastExamSnapshot.empty) {
    lastScore = Number(lastExamSnapshot.docs[0].data().score);
}

document.getElementById('lastScore').textContent = lastScore + '%';
document.getElementById('lastScore').classList.remove('invisible');
});














