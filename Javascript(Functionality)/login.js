// DARK MODE
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

// PASSWORD VISIBILITY TOGGLE
let passwordInput = document.getElementById('password');
let showPasswordIcon = document.getElementById('showPassword');

if (passwordInput && showPasswordIcon) {
    showPasswordIcon.addEventListener('click', () => {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            showPasswordIcon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            passwordInput.type = 'password';
            showPasswordIcon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    });
}

// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

// LOGIN FORM
const loginBtn = document.getElementById('submit');
const userEmailInput = document.getElementById('email');
const userPasswordInput = document.getElementById('password');

loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const email = userEmailInput.value.trim();
    const password = userPasswordInput.value;
    const selectedRole = document.getElementById('role').value; // ✅ Added

    if (!email || !password) {
        Swal.fire({ 
            title: "Fields cannot be empty", 
            text: "Please fill in all fields", 
            icon: "error" 
        });
        return;
    }

    try {
        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        const passwordChanged = params.get("passwordChanged");

        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            Swal.fire({
                title: "User record not found",
                text: "Please contact support.",
                icon: "error"
            });
            return;
        }

        const userData = userSnap.data();
        const actualRole = userData.role; 
        console.log("Selected Role:", selectedRole);
     console.log("Actual Role from Firestore:", actualRole);

   
   // 🔐 ROLE CHECK (Dual Access System)

// If user is student but tries to enter as an admin → deny
if (actualRole === "student" && selectedRole === "admin") {

    Swal.fire({
        title: "Access Denied",
        text: "You are not authorized for admin access.",
        icon: "error"
    });

    await auth.signOut();
    loginBtn.disabled = false;
    loginBtn.textContent = "Login";
    return;
}



        let userFullname = userData.fullname?.trim() || "";

        if (!userFullname) {
            userFullname = email.split('@')[0];
        }

        const creationTime = new Date(user.metadata.creationTime).getTime();
        const lastSignInTime = new Date(user.metadata.lastSignInTime).getTime();
        const isFirstTimeLogin = Math.abs(creationTime - lastSignInTime) < 5000;

        // Password change login
        if (redirect === "profile" && passwordChanged === "true") {
            Swal.fire({
                title: `Welcome, ${userFullname}! 🔐`,
                text: "Your password has been successfully updated.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            }).then(() => {

                // ✅ Role-based redirect
            if (selectedRole === "admin") {
         window.location.href = "./../Admin Pages/adminDashboard.html";
        } else {
    window.location.href = "../StudentPages/dashboard.html";
       }
            });
        }

        // First time login
     else if (isFirstTimeLogin) {

    if (actualRole === "admin") {

        Swal.fire({
            title: `Welcome Admin ${userFullname}! 🎉`,
            text: "Your admin account is ready.",
            icon: "success",
            timer: 3000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "./../Admin Pages/adminDashboard.html";
        });

    } else {

        Swal.fire({
            title: `Welcome ${userFullname}!`,
            text: "You are now signed in 🎉",
            icon: "success",
            timer: 3000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "../StudentPages/dashboard.html";
        });

    }
}

    // Normal returning user
else {

    if (selectedRole === "admin") {

        Swal.fire({
            title: `Welcome, Admin ${userFullname}! 🛠️`,
            text: "Admin access granted.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "./../Admin Pages/adminDashboard.html";
        });

    } else {

        Swal.fire({
            title: `Welcome back, ${userFullname}! 👋`,
            text: "Good to have you back.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "../StudentPages/dashboard.html";
        });

    }
}
} catch (err) {
        Swal.fire({ 
        title: "Login failed",
         text: err.message,
          icon: "error" });
        userPasswordInput.value = "";
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
    }
});





