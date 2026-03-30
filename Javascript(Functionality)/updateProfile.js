// FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

// Helper to update element text
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
}


//AVATAR DROPDOWN MENU TOGGLE
const userAvatar = document.getElementById("user-avatar");

userAvatar.addEventListener('click', function(){
    const dropDown = document.getElementById('profile-dropdown')
    if (dropDown){
        dropDown.classList.toggle('hidden')
    }
})




const userNameAvatar = document.getElementById('userName-avatar');
const fullNameInput = document.getElementById("full-name");

// Function to load user data
async function loadUserData(user) {
    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        let displayName = user.email.split('@')[0];

        if (userDoc.exists()) {
            const userData = userDoc.data();
            displayName = userData.fullname || displayName;
        }

        // Update input
        fullNameInput.value = displayName;

        // Update avatars
        const initials = displayName.charAt(0).toUpperCase();
        userAvatar.textContent = initials;
        userNameAvatar.textContent = initials;

    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Check for password changed message on page load
const params = new URLSearchParams(window.location.search);
const passwordChanged = params.get("passwordChanged");

if (passwordChanged === "true") {
    Swal.fire({
        icon: "success",
        title: "Password Changed Successfully!",
        text: "Your password has been updated. You can now continue using your account.",
        confirmButtonColor: '#2e8ff7',
        confirmButtonText: 'Got it',
        timer: 5000,
        timerProgressBar: true
    });
    
    // Remove parameter from URL
    const url = new URL(window.location);
    url.searchParams.delete("passwordChanged");
    window.history.replaceState({}, "", url);
}




// AUTHENTICATION GUARD: Redirect to signin page if user is not authenticated
onAuthStateChanged(auth, async (loggedInUser) => {
    if (!loggedInUser) {
        window.location.href = "./../index.html";
        return;
    }


    try {
        const uid = loggedInUser.uid;

        // ---- PROFILE ----
        const userSnap = await getDoc(doc(db, "users", uid));
        const userData = userSnap.exists() ? userSnap.data() : {};
        const fullName = userData.fullname || "Student";
        const email = userData.email || loggedInUser.email;
        
          const firstLetter = userData.email ? userData.email.charAt(0).toUpperCase() : 'U';
    userAvatar.textContent = firstLetter;


  
// Close dropdown on outside click
document.addEventListener('click', e => {
    if (userAvatar && !userAvatar.contains(e.target)) {
        const dropDown = document.getElementById('profile-dropdown');
        if (dropDown) {
            dropDown.classList.add('hidden');
        }
    }
});

        updateElementText('welcome-name', fullName);
        updateElementText('user-name', fullName);
        updateElementText('dropdown-user-name', fullName);
        updateElementText('dropdown-user-email', email);
        updateElementText('mobile-user-name', fullName);
        updateElementText('mobile-user-email', email);
   
    await loadUserData(userData);



    } catch (err) {
        console.error("Error loading dashboard:", err);
    }
});



// PASSWORD TOGGLE
function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
        toggle.addEventListener('click', function() {
            const input = document.getElementById(inputId);
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }
}
setupPasswordToggle('toggle-new-password', 'new-password');
setupPasswordToggle('toggle-confirm-password', 'confirm-password');
setupPasswordToggle('toggle-current-password', 'current-password');

// SAVE PROFILE
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const fullName = fullNameInput.value.trim();
        const currentPassword = document.getElementById("current-password")?.value;
        const newPassword = document.getElementById("new-password")?.value;
        const confirmPassword = document.getElementById("confirm-password")?.value;

        const saveBtn = document.getElementById('save-btn');
        const saveBtnText = document.getElementById('save-btn-text');
        const saveBtnIcon = document.getElementById('save-btn-icon');
        const saveBtnSpinner = document.getElementById('save-btn-spinner');

        // Validate that at least one field is being updated
        if (!fullName && !newPassword) {
            Swal.fire({
                icon: "warning",
                title: "No Changes",
                text: "Please fill in the fields you want to update."
            });
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtnText.textContent = "Saving...";
            saveBtnIcon.classList.add("hidden");
            saveBtnSpinner.classList.remove("hidden");

            // Update full name in Firestore if provided
            if (fullName) {
            await updateDoc(doc(db, "users", user.uid), { fullName });
            await loadUserData(user); // reload immediately
                
                // Immediately update the avatar with new initials
                const initials = fullName.charAt(0).toUpperCase();
                userAvatar.textContent = initials;
                userNameAvatar.textContent = initials;
                
                // // Show success message for name update
                // Swal.fire({
                //     icon: "success",
                //     title: "Name Updated!",
                //     text: "Your name has been updated successfully.",
                //     timer: 1500,
                //     showConfirmButton: false
                // });
            }

            // Handling password change if provided
            if (newPassword) {
                // Validate passwords match
                if (newPassword !== confirmPassword) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "New passwords do not match!"
                    });
                    return;
                }

                // Validate current password is provided
                if (!currentPassword) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Please enter your current password to change your password."
                    });
                    return;
                }

                try {
                    // Reauthenticate user
                    const credential = EmailAuthProvider.credential(user.email, currentPassword);
                    await reauthenticateWithCredential(user, credential);

                    // Update password
                    await updatePassword(user, newPassword);
                    
                    // Password changed successfully!
                    Swal.fire({
                        icon: "success",
                        title: "Password Updated!",
                        text: "Your password has been changed successfully. Please log in again with your new password.",
                        confirmButtonColor: '#2e8ff7',
                        confirmButtonText: 'Go to Login'
                    }).then(async () => {
                        await signOut(auth);
                        // Redirect to login with passwordChanged=true
                        window.location.href = "../OtherPages/login.html?redirect=profile&passwordChanged=true";
                    });
                    
                    return; 

                } catch (reauthError) {
                    console.error("Reauth error:", reauthError);
                    
                    if (reauthError.code === 'auth/wrong-password') {
                        Swal.fire({
                            icon: "error",
                            title: "Incorrect Password",
                            text: "The current password you entered is incorrect."
                        });
                    } else if (reauthError.code === 'auth/too-many-requests') {
                        Swal.fire({
                            icon: "error",
                            title: "Too Many Attempts",
                            text: "Access temporarily disabled due to many failed attempts. Try again later."
                        });
                    } else if (reauthError.code === 'auth/weak-password') {
                        Swal.fire({
                            icon: "error",
                            title: "New password is weak",
                            text: "Password should be at least 6 characters long."
                        });
                    }
                     else {
                        Swal.fire({
                            icon: "error",
                            title: "Authentication Failed",
                            text: "Please try again."
                        });
                    }
                    return;
                }
            }

            // Clear password fields
            document.getElementById("current-password").value = "";
            document.getElementById("new-password").value = "";
            document.getElementById("confirm-password").value = "";

        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Something went wrong. Please try again."
            });
        } finally {
            saveBtn.disabled = false;
            saveBtnText.textContent = "Save Changes";
            saveBtnIcon.classList.remove("hidden");
            saveBtnSpinner.classList.add("hidden");
        }
    });
}

// Delete Account From Firestore Btn
const deleteAccBtn = document.getElementById('deleteAccount-btn');
if (deleteAccBtn) {
    deleteAccBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        const result = await Swal.fire({
            title: 'Delete Account?',
            text: 'This action is permanent and cannot be undone. All your data will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete my account',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

  
        const { value: password } = await Swal.fire({
            title: 'Confirm Your Password',
            text: 'Please enter your password to confirm account deletion',
            input: 'password',
            inputLabel: 'Password',
            inputPlaceholder: 'Enter your password',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Delete Account',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Password is required!';
                }
            }
        });

        if (!password) return;

        try {
            Swal.fire({
                title: 'Deleting Account...',
                text: 'Please wait while we process your request.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Re-authenticating user before deletion
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // Deleting user data from Firestore
            await deleteDoc(doc(db, "users", user.uid));
            
            // Deleting the user authentication account
            // await deleteUser(user);

            // Success message and redirect
            await Swal.fire({
                icon: 'success',
                title: 'Account Deleted',
                text: 'Your account has been permanently deleted.',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });

            // Redirect to home page or login
            window.location.href = "../index.html";

        } catch (error) {
            console.error("Error deleting account:", error);
            
            // Handling errors
            let errorMessage = "Failed to delete account. Please try again.";
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password. Please try again.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed attempts. Please try again later.";
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = "This action requires recent login. Please log out and log in again.";
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#3085d6'
            });
        }
    });
}



// LOGOUT
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure you want to log out?',
                text: "You'll need to log in again to access your account.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#2e8ff7',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, log out',
                cancelButtonText: 'No, stay'
            });

            if (result.isConfirmed) {
                await signOut(auth);
                window.location.href = "../OtherPages/login.html";
            }

        } catch (err) {
            console.error("Error logging out:", err);
            Swal.fire({ 
            icon: "error", 
            title: "Error", 
            text: "Failed to logout. Try again." 
          });
        }
    });
}