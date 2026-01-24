// Global variables
let currentUser = null;
let userData = null;
const balanceStates = {usd: false, crypto: false};

// Crypto prices (you can update these with real-time prices later)
const cryptoPrices = {
    btc: 45000,
    eth: 3000,
    usdt: 1,
    bnb: 400
};

// Toggle balance visibility
function toggleBalance(type) {
    balanceStates[type] = !balanceStates[type];
    const el = document.getElementById(`${type}-balance`);
    const eye = document.getElementById(`${type}-eye`);
    if (balanceStates[type]) { 
        el.classList.add('balance-hidden'); 
        eye.classList.replace('fa-eye', 'fa-eye-slash'); 
    } else { 
        el.classList.remove('balance-hidden'); 
        eye.classList.replace('fa-eye-slash', 'fa-eye'); 
    }
}

// Modal functions
function openModal(id) { 
    document.getElementById(id).classList.add('active'); 
}

function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
    // Reset forms
    const form = document.querySelector(`#${id} form`);
    if (form) form.reset();
    // Clear recipient name
    const recipientName = document.getElementById('recipient-name');
    if (recipientName) recipientName.textContent = '';
}

// Close modal on background click
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', e => { 
            if(e.target === m) closeModal(m.id); 
        });
    });
});

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try { 
            await auth.signOut(); 
            window.location.href = 'login.html'; 
        } catch (e) { 
            console.error('Logout error:', e);
            alert('Error logging out'); 
        }
    }
}

// Load user data from database
async function loadUserData(uid) {
    try {
        const snap = await database.ref('users/' + uid).once('value');
        const data = snap.val();
        
        if (!data) {
            console.warn('No user data found');
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error loading user data:', error);
        throw error;
    }
}

// Update UI with user data
function updateUI(data) {
    const firstName = data.firstName || 'User';
    const lastName = data.lastName || '';
    const username = data.username || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Update all name fields
    document.getElementById('user-name').textContent = firstName;
    document.getElementById('nav-username').textContent = username;
    document.getElementById('mobile-username').textContent = username;
    document.getElementById('profile-fullname').textContent = fullName;
    document.getElementById('profile-username').textContent = username;
    document.getElementById('profile-email').textContent = data.email || '-';
    document.getElementById('profile-phone').textContent = data.phone || '-';
    document.getElementById('profile-country').textContent = data.country || '-';
    document.getElementById('profile-account').textContent = data.accountNumber || '-';
    
    // Update balances
    const usd = data.usdBalance || 0;
    const crypto = data.cryptoHoldings || {btc:0, eth:0, usdt:0, bnb:0};
    
    document.getElementById('usd-balance').textContent = `$${usd.toFixed(2)}`;
    document.getElementById('btc-amount').textContent = (crypto.btc || 0).toFixed(8);
    document.getElementById('eth-amount').textContent = (crypto.eth || 0).toFixed(8);
    document.getElementById('usdt-amount').textContent = (crypto.usdt || 0).toFixed(8);
    document.getElementById('bnb-amount').textContent = (crypto.bnb || 0).toFixed(8);
    
    // Calculate and display crypto values
    const vals = {
        btc: (crypto.btc || 0) * cryptoPrices.btc, 
        eth: (crypto.eth || 0) * cryptoPrices.eth, 
        usdt: (crypto.usdt || 0) * cryptoPrices.usdt, 
        bnb: (crypto.bnb || 0) * cryptoPrices.bnb
    };
    
    document.getElementById('btc-value').textContent = `$${vals.btc.toFixed(2)}`;
    document.getElementById('eth-value').textContent = `$${vals.eth.toFixed(2)}`;
    document.getElementById('usdt-value').textContent = `$${vals.usdt.toFixed(2)}`;
    document.getElementById('bnb-value').textContent = `$${vals.bnb.toFixed(2)}`;
    document.getElementById('crypto-balance').textContent = `$${(vals.btc + vals.eth + vals.usdt + vals.bnb).toFixed(2)}`;
}

// Load and display transactions
async function loadTransactions(uid) {
    try {
        const snap = await database.ref('transactions').orderByChild('userId').equalTo(uid).once('value');
        const transactions = snap.val();
        
        const transactionsListDiv = document.getElementById('transactions-list');
        const recentActivityDiv = document.getElementById('recent-activity');
        
        if (!transactions || Object.keys(transactions).length === 0) {
            transactionsListDiv.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-receipt text-4xl opacity-50 mb-3"></i>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }
        
        // Convert to array and sort by timestamp
        const txArray = Object.entries(transactions).map(([id, tx]) => ({id, ...tx})).sort((a, b) => b.timestamp - a.timestamp);
        
        // Update transactions modal
        let html = '<div class="space-y-3">';
        txArray.forEach(tx => {
            const statusClass = tx.status === 'pending' ? 'status-pending' : tx.status === 'approved' ? 'status-approved' : 'status-rejected';
            const icon = tx.type === 'transfer' ? 'fa-paper-plane' : 'fa-repeat';
            const date = new Date(tx.timestamp).toLocaleDateString();
            const time = new Date(tx.timestamp).toLocaleTimeString();
            
            html += `
                <div class="p-4 rounded-2xl bg-gray-50 border-2 border-gray-100">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <i class="fas ${icon} text-white"></i>
                            </div>
                            <div>
                                <p class="font-bold capitalize">${tx.type}</p>
                                <p class="text-xs text-gray-500">${date} at ${time}</p>
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${tx.status}</span>
                    </div>
                    <div class="mt-3 space-y-1 text-sm">
                        <p><span class="text-gray-600">Amount:</span> <span class="font-semibold">${tx.amount} ${tx.currency.toUpperCase()}</span></p>
                        ${tx.recipient ? `<p><span class="text-gray-600">Recipient:</span> <span class="font-semibold">${tx.recipientName || tx.recipient}</span></p>` : ''}
                        ${tx.fromCurrency ? `<p><span class="text-gray-600">From:</span> <span class="font-semibold">${tx.fromCurrency.toUpperCase()}</span> → <span class="font-semibold">${tx.toCurrency.toUpperCase()}</span></p>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        transactionsListDiv.innerHTML = html;
        
        // Update recent activity (show last 5)
        const recentTx = txArray.slice(0, 5);
        if (recentTx.length > 0) {
            let recentHtml = '<div class="space-y-3">';
            recentTx.forEach(tx => {
                const statusClass = tx.status === 'pending' ? 'status-pending' : tx.status === 'approved' ? 'status-approved' : 'status-rejected';
                const icon = tx.type === 'transfer' ? 'fa-paper-plane' : 'fa-repeat';
                const date = new Date(tx.timestamp).toLocaleDateString();
                
                recentHtml += `
                    <div class="p-3 rounded-2xl bg-gray-50 flex justify-between items-center">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <i class="fas ${icon} text-white text-sm"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-sm capitalize">${tx.type}</p>
                                <p class="text-xs text-gray-500">${date}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-sm">${tx.amount} ${tx.currency.toUpperCase()}</p>
                            <span class="status-badge ${statusClass} text-xs">${tx.status}</span>
                        </div>
                    </div>
                `;
            });
            recentHtml += '</div>';
            recentActivityDiv.innerHTML = recentHtml;
        }
        
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Lookup recipient by account number
async function lookupRecipient(accountNumber) {
    try {
        const snap = await database.ref('users').orderByChild('accountNumber').equalTo(accountNumber).once('value');
        const users = snap.val();
        
        if (!users) return null;
        
        const userId = Object.keys(users)[0];
        const user = users[userId];
        
        return {
            userId,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username
        };
    } catch (error) {
        console.error('Error looking up recipient:', error);
        return null;
    }
}

// Handle recipient lookup on input
document.addEventListener('DOMContentLoaded', () => {
    const recipientInput = document.getElementById('transfer-recipient');
    if (recipientInput) {
        recipientInput.addEventListener('blur', async function() {
            const accountNumber = this.value.trim();
            const recipientNameEl = document.getElementById('recipient-name');
            
            if (accountNumber.length === 10) {
                recipientNameEl.textContent = 'Looking up...';
                const recipient = await lookupRecipient(accountNumber);
                
                if (recipient) {
                    recipientNameEl.textContent = `✓ ${recipient.name} (@${recipient.username})`;
                    recipientNameEl.style.color = '#059669';
                } else {
                    recipientNameEl.textContent = '✗ Account not found';
                    recipientNameEl.style.color = '#dc2626';
                }
            } else if (accountNumber.length > 0) {
                recipientNameEl.textContent = 'Account number must be 10 digits';
                recipientNameEl.style.color = '#dc2626';
            } else {
                recipientNameEl.textContent = '';
            }
        });
    }
});

// Handle transfer form submission
document.addEventListener('DOMContentLoaded', () => {
    const transferForm = document.getElementById('transfer-form');
    if (transferForm) {
        transferForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currency = document.getElementById('transfer-currency').value;
            const recipientAccount = document.getElementById('transfer-recipient').value.trim();
            const amount = parseFloat(document.getElementById('transfer-amount').value);
            const pin = document.getElementById('transfer-pin').value;
            
            // Validate inputs
            if (!currency || !recipientAccount || !amount || !pin) {
                alert('Please fill in all fields');
                return;
            }
            
            if (recipientAccount.length !== 10) {
                alert('Account number must be 10 digits');
                return;
            }
            
            if (pin !== userData.transactionPin) {
                alert('Incorrect PIN');
                return;
            }
            
            if (amount <= 0) {
                alert('Amount must be greater than 0');
                return;
            }
            
            // Check balance
            let currentBalance = 0;
            if (currency === 'usd') {
                currentBalance = userData.usdBalance || 0;
            } else {
                currentBalance = userData.cryptoHoldings[currency] || 0;
            }
            
            if (amount > currentBalance) {
                alert('Insufficient balance');
                return;
            }
            
            // Lookup recipient
            const recipient = await lookupRecipient(recipientAccount);
            if (!recipient) {
                alert('Recipient account not found');
                return;
            }
            
            // Confirm transaction
            if (!confirm(`Send ${amount} ${currency.toUpperCase()} to ${recipient.name}?`)) {
                return;
            }
            
            try {
                // Create transaction record
                const txRef = database.ref('transactions').push();
                await txRef.set({
                    userId: currentUser.uid,
                    senderName: `${userData.firstName} ${userData.lastName}`,
                    senderAccount: userData.accountNumber,
                    recipient: recipientAccount,
                    recipientUserId: recipient.userId,
                    recipientName: recipient.name,
                    currency: currency,
                    amount: amount,
                    type: 'transfer',
                    status: 'pending',
                    timestamp: Date.now(),
                    createdAt: new Date().toISOString()
                });
                
                alert('Transfer submitted successfully! Waiting for admin approval.');
                closeModal('transfer-modal');
                
                // Reload transactions
                await loadTransactions(currentUser.uid);
                
            } catch (error) {
                console.error('Transfer error:', error);
                alert('Error processing transfer. Please try again.');
            }
        });
    }
});

// Handle convert form submission
document.addEventListener('DOMContentLoaded', () => {
    const convertForm = document.getElementById('convert-form');
    if (convertForm) {
        convertForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fromCurrency = document.getElementById('convert-from').value;
            const toCurrency = document.getElementById('convert-to').value;
            const amount = parseFloat(document.getElementById('convert-amount').value);
            
            // Validate inputs
            if (!fromCurrency || !toCurrency || !amount) {
                alert('Please fill in all fields');
                return;
            }
            
            if (fromCurrency === toCurrency) {
                alert('Cannot convert to the same currency');
                return;
            }
            
            if (amount <= 0) {
                alert('Amount must be greater than 0');
                return;
            }
            
            // Check balance
            let currentBalance = 0;
            if (fromCurrency === 'usd') {
                currentBalance = userData.usdBalance || 0;
            } else {
                currentBalance = userData.cryptoHoldings[fromCurrency] || 0;
            }
            
            if (amount > currentBalance) {
                alert('Insufficient balance');
                return;
            }
            
            // Calculate conversion
            let fromPrice = fromCurrency === 'usd' ? 1 : cryptoPrices[fromCurrency];
            let toPrice = toCurrency === 'usd' ? 1 : cryptoPrices[toCurrency];
            let convertedAmount = (amount * fromPrice) / toPrice;
            
            // Confirm conversion
            if (!confirm(`Convert ${amount} ${fromCurrency.toUpperCase()} to ${convertedAmount.toFixed(8)} ${toCurrency.toUpperCase()}?`)) {
                return;
            }
            
            try {
                // Create transaction record
                const txRef = database.ref('transactions').push();
                await txRef.set({
                    userId: currentUser.uid,
                    userName: `${userData.firstName} ${userData.lastName}`,
                    fromCurrency: fromCurrency,
                    toCurrency: toCurrency,
                    amount: amount,
                    convertedAmount: convertedAmount,
                    type: 'convert',
                    status: 'pending',
                    timestamp: Date.now(),
                    createdAt: new Date().toISOString()
                });
                
                alert('Conversion submitted successfully! Waiting for admin approval.');
                closeModal('convert-modal');
                
                // Reload transactions
                await loadTransactions(currentUser.uid);
                
            } catch (error) {
                console.error('Conversion error:', error);
                alert('Error processing conversion. Please try again.');
            }
        });
    }
});

// Main authentication handler
auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed, user:', user);
    
    if (!user) { 
        console.log('No user logged in, redirecting to login');
        window.location.href = 'login.html'; 
        return; 
    }
    
    currentUser = user;
    
    try {
        // Show loading overlay
        document.getElementById('loading-overlay').style.display = 'flex';
        
        // Load user data
        userData = await loadUserData(user.uid);
        
        if (userData) {
            console.log('User data loaded:', userData);
            
            // Update UI
            updateUI(userData);
            
            // Load transactions
            await loadTransactions(user.uid);
            
            // Update last login
            await database.ref('users/' + user.uid).update({
                lastLogin: Date.now()
            });
            
        } else {
            console.warn('No user data found');
            alert('Error loading user data. Please contact support.');
        }
        
        // Hide loading overlay
        document.getElementById('loading-overlay').style.display = 'none';
        
    } catch(error) { 
        console.error('Error loading dashboard:', error);
        document.getElementById('loading-overlay').style.display = 'none';
        alert('Error loading your data. Please try refreshing the page.');
    }
});