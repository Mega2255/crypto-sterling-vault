// 1. Initialize Form Data Object
let formData = {
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
    const username = document.getElementById('username').value.trim();
    const usernameError = document.getElementById('username-error');

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

    formData.firstName = firstName;
    formData.lastName = lastName;
    formData.middleName = document.getElementById('middle-name').value.trim();
    formData.username = username;

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
    const phoneError = document.getElementById('phone-error');

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

    formData.email = email;
    formData.phone = phone;
    formData.country = country;

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

// 7. FINAL SUBMISSION (The fix is here)
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

    if (transactionPin.length !== 4) {
        alert("Transaction PIN must be 4 digits");
        return;
    }

    // Set Loading state
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    registerBtn.disabled = true;

    try {
        // A. Create Authentication User
        const userCredential = await auth.createUserWithEmailAndPassword(formData.email, password);
        const user = userCredential.user;

        // B. Generate the Account Number
        const generatedAcc = generateAccountNumber();

        // C. Prepare Database Object (All details included)
        const finalUserData = {
            uid: user.uid,
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName || "",
            fullName: `${formData.firstName} ${formData.lastName}`,
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            country: formData.country,
            accountNumber: generatedAcc,
            transactionPin: transactionPin,
            balance: 0.00,
            accountStatus: "Active",
            createdAt: new Date().toISOString()
        };

        // D. SAVE TO DATABASE FIRST (Wait for completion)
        await database.ref('users/' + user.uid).set(finalUserData);
        
        // E. Update Auth Profile for backup
        await user.updateProfile({
            displayName: formData.username
        });

        // SUCCESS
        alert("Registration Successful! Account Number: " + generatedAcc);
        
        // F. REDIRECT ONLY AFTER EVERYTHING IS SAVED
        window.location.href = 'userdashboard.html';

    } catch (error) {
        console.error("Registration Error:", error);
        alert("Registration Failed: " + error.message);
        registerBtn.innerHTML = 'Create Account';
        registerBtn.disabled = false;
    }
});

// 8. Auth State Observer
auth.onAuthStateChanged((user) => {
    // If user is logged in and tries to access register page, send them to dashboard
    if (user && window.location.pathname.includes('register.html')) {
        // window.location.href = 'userdashboard.html';
    }
});