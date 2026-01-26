// User Dashboard JavaScript - FIXED VERSION
// Firebase is already initialized in firebase-config.js

// Global user state
let currentUser = null;
let userAccountData = null;
let isLoadingData = true;
let authInitialized = false; // NEW: Track if auth has initialized

// Initialize user session on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DASHBOARD PAGE LOADED ===');
    showLoadingState();
    initializeUserSession();
    setupEventListeners();
});

// Show loading state
function showLoadingState() {
    const nameElements = document.querySelectorAll('[data-user-name]');
    nameElements.forEach(el => {
        el.textContent = 'Loading...';
    });
    
    const balanceElements = document.querySelectorAll('[data-balance]');
    balanceElements.forEach(el => {
        el.textContent = '...';
    });
}

// Initialize user session - FIXED VERSION
function initializeUserSession() {
    console.log('Initializing user session...');
    
    // ✅ CRITICAL FIX: Add timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
        if (!authInitialized) {
            console.error('⚠️ Auth initialization timeout - redirecting to login');
            window.location.href = 'login.html';
        }
    }, 5000); // 5 second timeout
    
    // ✅ PROPER AUTH STATE LISTENER
    firebase.auth().onAuthStateChanged((user) => {
        authInitialized = true; // Mark auth as initialized
        clearTimeout(authTimeout); // Clear the timeout
        
        console.log('=== AUTH STATE CHANGED ===');
        console.log('User object:', user);
        
        if (user) {
            // ✅ USER IS LOGGED IN
            console.log('✅ User authenticated:', user.uid);
            console.log('✅ User email:', user.email);
            currentUser = user;
            
            // Load user data from database
            loadUserData(user.uid);
            
        } else {
            // ❌ NO USER - But only redirect if NOT on auth pages
            console.log('❌ No user authenticated');
            
            const currentPath = window.location.pathname;
            const isAuthPage = currentPath.includes('login.html') || 
                              currentPath.includes('register.html');
            
            if (!isAuthPage) {
                console.log('Redirecting to login...');
                window.location.href = 'login.html';
            }
        }
    }, (error) => {
        // ✅ HANDLE AUTH ERRORS
        console.error('❌ Auth state error:', error);
        authInitialized = true;
        clearTimeout(authTimeout);
        alert('Authentication error: ' + error.message);
        window.location.href = 'login.html';
    });
}

// Load user data from Firebase with REAL-TIME LISTENER
function loadUserData(userId) {
    console.log('Setting up real-time listener for user:', userId);

    const userRef = firebase.database().ref('users/' + userId);

    // ✅ ADD ERROR HANDLING AND TIMEOUT
    const dataTimeout = setTimeout(() => {
        if (isLoadingData) {
            console.error('⚠️ Data loading timeout');
            alert('Unable to load user data. Please refresh the page.');
        }
    }, 10000); // 10 second timeout for data loading

    userRef.on('value', (snapshot) => {
        clearTimeout(dataTimeout);
        userAccountData = snapshot.val();

        console.log('=== DATA RECEIVED FROM FIREBASE ===');
        console.log('User data:', userAccountData);

        if (userAccountData) {
            isLoadingData = false;
            
            // ✅ VERIFY CRITICAL FIELDS
            console.log('firstName:', userAccountData.firstName);
            console.log('lastName:', userAccountData.lastName);
            console.log('email:', userAccountData.email);
            console.log('accountNumber:', userAccountData.accountNumber);
            console.log('balance:', userAccountData.balance);
            
            updateUIWithUserData();
        } else {
            console.warn('⚠️ No user data found in database');
            isLoadingData = false;
            
            // ✅ CREATE FALLBACK PROFILE IF MISSING
            console.log('Creating fallback user profile...');
            createUserProfile(userId);
        }
    }, (error) => {
        clearTimeout(dataTimeout);
        console.error('❌ Error loading user data:', error);
        isLoadingData = false;
        alert('Error loading account data: ' + error.message);
    });
}

// Create new user profile (FALLBACK ONLY)
function createUserProfile(userId) {
    console.warn('Creating fallback user profile for:', userId);
    
    const newUser = {
        userId: userId,
        email: currentUser.email,
        accountNumber: generateAccountNumber(),
        balance: 0,
        transactionLimit: 500000,
        kycVerified: false,
        accountType: 'Standard',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        firstName: currentUser.displayName || 'User',
        lastName: '',
        middleName: '',
        username: currentUser.email.split('@')[0],
        phone: '',
        address: '',
        city: '',
        country: '',
        dateOfBirth: '',
        gender: ''
    };
    
    firebase.database().ref('users/' + userId).set(newUser)
        .then(() => {
            console.log('✅ Fallback profile created successfully');
        })
        .catch((error) => {
            console.error('❌ Error creating fallback profile:', error);
            alert('Error creating user profile. Please contact support.');
        });
}

// Generate account number
function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Generate user initials from first and last name
function getUserInitials() {
    if (!userAccountData) return 'U';
    
    const firstName = userAccountData.firstName || '';
    const lastName = userAccountData.lastName || '';
    
    console.log('Generating initials from:', { firstName, lastName });
    
    if (!firstName && !lastName) {
        if (userAccountData.username) {
            return userAccountData.username.charAt(0).toUpperCase();
        }
        return currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U';
    }
    
    const firstInitial = firstName.charAt(0).toUpperCase() || '';
    const lastInitial = lastName.charAt(0).toUpperCase() || '';
    
    return firstInitial + lastInitial;
}

// Update UI with user data
function updateUIWithUserData() {
    if (!userAccountData) {
        console.warn('updateUIWithUserData called but userAccountData is null');
        return;
    }
    
    console.log('=== UPDATING UI ===');
    
    // Update balance displays
    const balanceElements = document.querySelectorAll('[data-balance]');
    console.log('Found', balanceElements.length, 'balance elements');
    balanceElements.forEach(el => {
        el.textContent = formatCurrency(userAccountData.balance || 0);
    });
    
    // Update account number
    const accountNumberElements = document.querySelectorAll('[data-account-number]');
    console.log('Found', accountNumberElements.length, 'account number elements');
    accountNumberElements.forEach(el => {
        el.textContent = userAccountData.accountNumber || '';
    });
    
    // Update user name - Build full name with proper fallback
    let userName = '';
    if (userAccountData.firstName && userAccountData.lastName) {
        userName = `${userAccountData.firstName} ${userAccountData.lastName}`;
    } else if (userAccountData.firstName) {
        userName = userAccountData.firstName;
    } else if (userAccountData.lastName) {
        userName = userAccountData.lastName;
    } else if (userAccountData.username) {
        userName = userAccountData.username;
    } else {
        userName = 'User';
    }
    
    console.log('Setting user name to:', userName);
    
    const nameElements = document.querySelectorAll('[data-user-name]');
    console.log('Found', nameElements.length, 'name elements');
    nameElements.forEach(el => {
        el.textContent = userName;
    });
    
    // Update user initials in avatar circles
    const initials = getUserInitials();
    console.log('Setting initials to:', initials);
    
    // Update all avatar circles
    const updateAvatarText = (element) => {
        if (element.querySelector('i') || element.querySelector('.fa')) {
            return;
        }
        
        const text = element.textContent.trim();
        if (text.length <= 15) {
            element.textContent = initials;
        }
    };
    
    document.querySelectorAll('.w-12.h-12.bg-cyan-500.rounded-full').forEach(updateAvatarText);
    document.querySelectorAll('.w-12.h-12.bg-white\\/20.rounded-full').forEach(updateAvatarText);
    
    document.querySelectorAll('.bg-cyan-500.rounded-full').forEach(el => {
        if (!el.querySelector('i') && !el.querySelector('.fa')) {
            const text = el.textContent.trim();
            if (text.length <= 15 && text.length > 0) {
                el.textContent = initials;
            }
        }
    });
    
    // Update transaction limit
    const limitElements = document.querySelectorAll('[data-transaction-limit]');
    console.log('Found', limitElements.length, 'limit elements');
    limitElements.forEach(el => {
        el.textContent = formatCurrency(userAccountData.transactionLimit || 500000);
    });
    
    console.log('=== UI UPDATE COMPLETE ===');
}

// Format currency
function formatCurrency(amount, currency = 'NGN') {
    return new Intl.NumberFormat('en-NG', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Setup all event listeners
function setupEventListeners() {
    // Local Transfer Form
    const localTransferForm = document.getElementById('localTransferForm');
    if (localTransferForm) {
        localTransferForm.addEventListener('submit', handleLocalTransfer);
    }
    
    // Wire Transfer Form
    const wireTransferForm = document.getElementById('wireTransferForm');
    if (wireTransferForm) {
        wireTransferForm.addEventListener('submit', handleWireTransfer);
    }
    
    // PayPal Transfer Form
    const paypalTransferForm = document.getElementById('paypalTransferForm');
    if (paypalTransferForm) {
        paypalTransferForm.addEventListener('submit', handlePayPalTransfer);
    }
    
    // Crypto Transfer Form
    const cryptoTransferForm = document.getElementById('cryptoTransferForm');
    if (cryptoTransferForm) {
        cryptoTransferForm.addEventListener('submit', handleCryptoTransfer);
    }
    
    // Card Deposit Forms
    const cardDepositForm = document.getElementById('cardDepositForm');
    if (cardDepositForm) {
        cardDepositForm.addEventListener('submit', handleCardDeposit);
    }
    
    const cryptoDepositForm = document.getElementById('cryptoDepositForm');
    if (cryptoDepositForm) {
        cryptoDepositForm.addEventListener('submit', handleCryptoDeposit);
    }
    
    // Loan Application Form
    const loanApplicationForm = document.getElementById('loanApplicationForm');
    if (loanApplicationForm) {
        loanApplicationForm.addEventListener('submit', handleLoanApplication);
    }
    
    // Card Application Form
    const cardApplicationForm = document.getElementById('cardApplicationForm');
    if (cardApplicationForm) {
        cardApplicationForm.addEventListener('submit', handleCardApplication);
    }
    
    // Profile Update Form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Logout button
    const logoutButtons = document.querySelectorAll('[data-logout]');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
}

// [REST OF YOUR FUNCTIONS REMAIN THE SAME]
// Handle Local Transfer
function handleLocalTransfer(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get('amount') || e.target.querySelector('input[type="text"]').value.replace(/,/g, ''));
    const beneficiaryName = e.target.querySelectorAll('input[type="text"]')[1].value;
    const accountNumber = e.target.querySelectorAll('input[type="text"]')[2].value;
    const bankName = e.target.querySelector('select').value;
    const pin = e.target.querySelector('input[type="password"]').value;
    const note = e.target.querySelector('textarea')?.value || '';
    
    if (!amount || !beneficiaryName || !accountNumber || !bankName || !pin) {
        alert('Please fill in all required fields');
        return;
    }
    
    const transferData = {
        userId: currentUser.uid,
        type: 'local_transfer',
        amount: amount,
        beneficiaryName: beneficiaryName,
        accountNumber: accountNumber,
        bankName: bankName,
        note: note,
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        userEmail: currentUser.email,
        userAccountNumber: userAccountData.accountNumber
    };
    
    firebase.database().ref('transactions').push(transferData)
        .then(() => {
            alert('Transfer initiated successfully! Waiting for admin approval.');
            e.target.reset();
            setTimeout(() => {
                window.location.href = 'userdashboard.html';
            }, 1500);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Transfer failed. Please try again.');
        });
}

// [INCLUDE ALL OTHER HANDLER FUNCTIONS FROM YOUR ORIGINAL FILE]
// Handle Wire Transfer, PayPal Transfer, Crypto Transfer, etc.
// (Copy them exactly as they are in your original file)

// Handle Logout
function handleLogout(e) {
    e.preventDefault();
    
    firebase.auth().signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error logging out:', error);
            alert('Logout failed. Please try again.');
        });
}

// Load admin bank details for deposit
function loadAdminBankDetails() {
    const bankDetailsRef = firebase.database().ref('admin_settings/bank_details');
    const cryptoDetailsRef = firebase.database().ref('admin_settings/crypto_wallets');
    
    bankDetailsRef.on('value', (snapshot) => {
        const bankDetails = snapshot.val();
        if (bankDetails && document.getElementById('bankTransferSection')) {
            const section = document.getElementById('bankTransferSection');
            section.querySelector('[data-bank-name]').textContent = bankDetails.bankName || 'Calivra Chase Bank';
            section.querySelector('[data-account-number]').textContent = bankDetails.accountNumber || userAccountData?.accountNumber || '';
            section.querySelector('[data-account-name]').textContent = bankDetails.accountName || 'Calivra Chase';
        }
    });
    
    cryptoDetailsRef.on('value', (snapshot) => {
        const cryptoWallets = snapshot.val();
        if (cryptoWallets && document.getElementById('cryptoSection')) {
            const btcWallet = cryptoWallets.btc || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
            const walletElements = document.querySelectorAll('[data-crypto-wallet]');
            walletElements.forEach(el => {
                el.textContent = btcWallet;
            });
        }
    });
}

if (document.getElementById('bankTransferSection') || document.getElementById('cryptoSection')) {
    loadAdminBankDetails();
}

console.log('=== USER-DASHBOARD.JS LOADED SUCCESSFULLY ===');
