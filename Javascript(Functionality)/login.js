//  Dark Mode Script
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




// Password visibility toggle
let passwordInput = document.getElementById('password');
let showPasswordIcon = document.getElementById('showPassword');

showPasswordIcon.addEventListener('click', () => {
    if (passwordInput.type == 'password') {
        passwordInput.type = 'text';
        showPasswordIcon.classList.replace('fa-eye-slash', 'fa-eye');

    } else {
        passwordInput.type = 'password';
        showPasswordIcon.classList.replace('fa-eye', 'fa-eye-slash');

    }
})






//  Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";



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
const usersCollection = collection(dataBase, "users");



let loginBtn = document.getElementById('submit');
let useremail = document.getElementById('email');
let userpassword = document.getElementById('password');


loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    let userEmail = useremail.value;
    let userPassword = userpassword.value;



       // FORM VALIDATION
    if (userEmail == ''|| userPassword == '') {
        Swal.fire({
            title: "Fields cannot be empty",
            text: 'Pls fill all field before proceeding',
            icon: "error"
        });
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in';
        const createUser = await signInWithEmailAndPassword(auth, userEmail, userPassword);

        Swal.fire({
            title: "Login successful!",
            text: `Welcome! ${userEmail}, you are now logged in`,
            icon: "success"
        }).then(()=>{
            window.location.href = '../StudentPages/dashboard.html';
        })

        loginBtn.disabled = false;
        loginBtn.textContent = 'login';
        useremail.value = '';
        userpassword.value = '';


    } catch (error) {

        Swal.fire({
            title: "Login failed",
            text: error.message,
            icon: "error"
        });
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign Up';
    }
})

