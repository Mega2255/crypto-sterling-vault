// Registration Script - FIXED VERSION
// Ensures data persists BEFORE redirect

// 1. Initialize Form Data Object - USING WINDOW SCOPE
window.formData = {
    firstName: '',
    lastName: '',
    middleName: '',
    username: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    transactionPin: ''
};

// 2. Helper: Generate Account Number
function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// 3. Navigation: Step 1 to Step 2
function goToStep2() {
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const middleName = document.getElementById('middle-name').value.trim();
    const username = document.getElementById('username').value.trim();
    const usernameError = document.getElementById('username-error');

    console.log('=== STEP 1 DEBUG ===');
    console.log('First Name Input:', firstName);
    console.log('Last Name Input:', lastName);
    console.log('Username Input:', username);

    if (!firstName || !lastName || !username) {
        alert('Please fill in all required fields');
        return;
    }

    if (username.length < 3) {
        usernameError.textContent = 'Username must be at least 3 characters';
        usernameError.classList.remove('hidden');
        return;
    }

    usernameError.classList.add('hidden');

    // SAVE TO GLOBAL OBJECT
    window.formData.firstName = firstName;
    window.formData.lastName = lastName;
    window.formData.middleName = middleName;
    window.formData.username = username;

    console.log('✅ Saved to formData:', window.formData);

    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');

    // Update Progress UI
    document.getElementById('progress-bar-1').style.width = '100%';
    document.getElementById('step1-indicator').style.backgroundColor = '#10b981';
    document.getElementById('step1-indicator').innerHTML = '<i class="fas fa-check"></i>';
    document.getElementById('step2-indicator').classList.remove('bg-gray-200', 'text-gray-400');
    document.getElementById('step2-indicator').classList.add('text-white');
    document.getElementById('step2-indicator').style.backgroundColor = '#1e3a8a';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. Navigation: Step 2 to Step 3
function goToStep3() {
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const country = document.getElementById('country').value;
    const emailError = document.getElementById('email-error');

    console.log('=== STEP 2 DEBUG ===');
    console.log('Email Input:', email);
    console.log('Phone Input:', phone);
    console.log('Country Input:', country);

    if (!email || !phone || !country) {
        alert('Please fill in all required fields');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.remove('hidden');
        return;
    }
    emailError.classList.add('hidden');

    // SAVE TO GLOBAL OBJECT
    window.formData.email = email;
    window.formData.phone = phone;
    window.formData.country = country;

    console.log('✅ Saved to formData:', window.formData);

    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-3').classList.add('active');

    // Update Progress UI
    document.getElementById('progress-bar-2').style.width = '100%';
    document.getElementById('step2-indicator').style.backgroundColor = '#10b981';
    document.getElementById('step2-indicator').innerHTML = '<i class="fas fa-check"></i>';
    document.getElementById('step3-indicator').classList.remove('bg-gray-200', 'text-gray-400');
    document.getElementById('step3-indicator').classList.add('text-white');
    document.getElementById('step3-indicator').style.backgroundColor = '#1e3a8a';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. Back Navigation
function goToStep1() {
    document.getElementById('step-2').classList.remove('active');
    document.getElementById('step-1').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2FromStep3() {
    document.getElementById('step-3').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 6. Password Visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + '-icon');
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// 7. FINAL SUBMISSION - ENHANCED WITH PROPER VERIFICATION
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const transactionPin = document.getElementById('transaction-pin').value;
    const registerBtn = document.getElementById('register-btn');

    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    if (transactionPin.length !== 4 || isNaN(transactionPin)) {
        alert("Transaction PIN must be exactly 4 digits");
        return;
    }

    console.log('=== FINAL SUBMISSION DEBUG ===');
    console.log('Complete Form Data:', window.formData);

    // CRITICAL CHECK
    if (!window.formData.firstName || !window.formData.lastName || !window.formData.email) {
        alert('ERROR: Required data is missing! Please go back and re-enter your information.');
        console.error('Form data is incomplete:', window.formData);
        return;
    }

    // Set Loading state
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';
    registerBtn.disabled = true;

    try {
        console.log('Step 1: Creating Firebase auth user...');
        
        // A. Create Authentication User
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(
            window.formData.email, 
            password
        );
        const user = userCredential.user;

        console.log('✅ User authentication created with UID:', user.uid);

        // B. Update Auth Profile FIRST (helps with display name)
        await user.updateProfile({
            displayName: `${window.formData.firstName} ${window.formData.lastName}`
        });
        console.log('✅ Auth profile updated');

        // C. Generate the Account Number
        const generatedAccountNumber = generateAccountNumber();
        console.log('✅ Generated account number:', generatedAccountNumber);

        // D. Prepare Complete Database Object
        const finalUserData = {
            // Authentication Info
            userId: user.uid,
            email: window.formData.email,
            
            // Personal Information - CRITICAL FIELDS
            firstName: window.formData.firstName,
            lastName: window.formData.lastName,
            middleName: window.formData.middleName || "",
            username: window.formData.username,
            phone: window.formData.phone,
            country: window.formData.country,
            
            // Additional Profile Fields
            dateOfBirth: '',
            gender: '',
            address: '',
            city: '',
            
            // Account Details
            accountNumber: generatedAccountNumber,
            accountType: 'Standard',
            balance: 0,
            transactionLimit: 500000,
            
            // Security
            transactionPin: transactionPin,
            kycVerified: false,
            
            // Timestamps
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            lastLogin: firebase.database.ServerValue.TIMESTAMP
        };

        console.log('Step 2: Saving user data to Firebase...');
        console.log('Data to save:', finalUserData);

        // E. ✅ CRITICAL: AWAIT THE DATABASE WRITE
        await firebase.database().ref('users/' + user.uid).set(finalUserData);
        
        console.log('✅ Data saved to Firebase Realtime Database!');
        
        // F. ✅ WAIT FOR FIREBASE TO CONFIRM THE WRITE
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying data...';
        
        // Wait 500ms for Firebase to process
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // G. ✅ VERIFY the data was actually written
        console.log('Step 3: Verifying data in Firebase...');
        const verification = await firebase.database().ref('users/' + user.uid).once('value');
        const savedData = verification.val();
        
        if (!savedData) {
            throw new Error('Data verification failed - no data found in database');
        }
        
        console.log('✅ VERIFICATION PASSED - Data in Firebase:', savedData);
        console.log('  firstName:', savedData.firstName);
        console.log('  lastName:', savedData.lastName);
        console.log('  email:', savedData.email);
        console.log('  accountNumber:', savedData.accountNumber);

        // H. SUCCESS - Show success message
        registerBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Success!';
        registerBtn.style.backgroundColor = '#10b981';
        
        // Show detailed success alert
        alert(
            `✅ Registration Successful!\n\n` +
            `Name: ${window.formData.firstName} ${window.formData.lastName}\n` +
            `Email: ${window.formData.email}\n` +
            `Account Number: ${generatedAccountNumber}\n\n` +
            `Please save your account number for future reference!`
        );
        
        console.log('✅ Registration complete! Preparing to redirect...');
        
        // I. ✅ WAIT 2 SECONDS TO ENSURE EVERYTHING IS SYNCED
        registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redirecting...';
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // J. ✅ REDIRECT TO DASHBOARD
        console.log('✅ Redirecting to dashboard now...');
        window.location.href = 'index.html';

    } catch (error) {
        console.error("❌ Registration Error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        let errorMessage = "Registration Failed:\n\n";
        
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += 'This email is already registered.\nPlease login instead or use a different email.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += 'Password is too weak.\nPlease use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address format.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage += 'Network error.\nPlease check your internet connection and try again.';
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'An unknown error occurred. Please try again.';
        }
        
        alert(errorMessage);
        
        // Reset button
        registerBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Create Account';
        registerBtn.disabled = false;
        registerBtn.style.backgroundColor = '#0891b2';
    }
});

// 8. ✅ PREVENT DOUBLE REGISTRATION - Redirect if already logged in
firebase.auth().onAuthStateChanged((user) => {
    if (user && window.location.pathname.includes('register.html')) {
        console.log('⚠️ User already logged in, redirecting to dashboard');
        // Small delay to show they're logged in
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
});

// 9. Debug on page load
console.log('=== REGISTER.JS LOADED SUCCESSFULLY ===');
console.log('Initial formData:', window.formData);
console.log('Firebase auth available:', typeof firebase !== 'undefined' && typeof firebase.auth === 'function');
console.log('Firebase database available:', typeof firebase !== 'undefined' && typeof firebase.database === 'function');
