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
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";



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



let signUpBtn = document.getElementById('submit');
let userName = document.getElementById('fullname');
let useremail = document.getElementById('email');
let userpassword = document.getElementById('password');
let confirmpassword = document.getElementById('confirm-password');




signUpBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    let userFullName = userName.value;
    let userEmail = useremail.value;
    let userPassword = userpassword.value;
    let confirmPassword = confirmpassword.value;

       // FORM VALIDATION
    if (userFullName == ''|| userEmail == '' || userPassword == '' || confirmPassword == '') {
        Swal.fire({
            title: "Fields cannot be empty",
            text: 'Pls fill all field before proceeding',
            icon: "error"
        });
        return;
    }
    else if (userPassword !== confirmPassword) {
        Swal.fire({
            title: "Passwords Mismatch",
            text: "Please ensure both passwords are the same.",
            icon: "error"
        });
        return;
    } else if(userFullName.includes('@') || userFullName.includes('.') || userFullName.includes(',') || userFullName.includes('!') || userFullName.includes('#') || userFullName.includes('$') || userFullName.includes('%') || userFullName.includes('^') || userFullName.includes('&') || userFullName.includes('*') || userFullName.includes('(') || userFullName.includes(')') || userFullName.includes('-') || userFullName.includes('+') || userFullName.includes('=') || userFullName.includes('/') || userFullName.includes('\\')) {
        Swal.fire({
            title: "Invalid Full Name",
            text: "Please enter a valid full name.",
            icon: "error"
        });
        return;
    }

    try {
        signUpBtn.disabled = true;
        signUpBtn.textContent = 'Signing up';
        const createUser = await createUserWithEmailAndPassword(auth, userEmail, userPassword);
        console.log(createUser);

       const addUserToFirestore = await setDoc(doc(dataBase, "users", createUser.user.uid), {
            uid: createUser.user.uid,
            fullname: userFullName,
            email: userEmail,
           role: 'student',
           createdAt: new Date()
            // password: userPassword,
            // confirmpassword: confirmPassword,

        });

        Swal.fire({
            title: "Sign up successful!",
            text: `Welcome! ${userFullName}🎉, your account has been created successfully.`,
            icon: "success"
        }).then(()=>{
            window.location.href = '../OtherPages/login.html';
        })

       

        signUpBtn.disabled = false;
        signUpBtn.textContent = 'Sign Up';
        userName.value = '';
        useremail.value = '';
        userpassword.value = '';
        confirmpassword.value = '';

    } catch (error) {

        Swal.fire({
            title: "Signup Failed",
            text: error.message,
            icon: "error"
        });
        signUpBtn.disabled = false;
        signUpBtn.textContent = 'Sign Up';
    }
})