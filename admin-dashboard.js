// Admin Dashboard JavaScript - COMPLETE FIXED VERSION
// Firebase is already initialized in firebase-config.js

let adminUser = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('=== ADMIN DASHBOARD INITIALIZING ===');
    initializeAdminSession();
});

function initializeAdminSession() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('Admin authenticated:', user.email);
            if (user.email && user.email.toLowerCase().includes('admin')) {
                adminUser = user;
                loadAdminDashboard();
            } else {
                alert('Unauthorized: Admin privileges required.');
                firebase.auth().signOut();
                window.location.href = 'admin-login.html';
            }
        } else {
            window.location.href = 'admin-login.html';
        }
    });
}

function loadAdminDashboard() {
    loadStatistics();
    loadUsers();
    loadTransactions();
    loadDeposits();
    loadLoans();
    loadCardApplications();
    loadSettings();
    setupAdminEventListeners();
}

function loadStatistics() {
    const db = firebase.database();
    
    db.ref('users').once('value', (snapshot) => {
        updateStat('totalUsers', snapshot.numChildren());
    });

    db.ref('users').once('value', (usersSnapshot) => {
        let pending = 0, approved = 0;
        usersSnapshot.forEach((userSnapshot) => {
            const transactions = userSnapshot.val().transactions;
            if (transactions) {
                Object.values(transactions).forEach((tx) => {
                    if (tx.status === 'Pending') pending++;
                    else if (tx.status === 'Approved') approved++;
                });
            }
        });
        updateStat('pendingTransactions', pending);
        updateStat('approvedTransactions', approved);
    });

    db.ref('users').once('value', (usersSnapshot) => {
        let pending = 0;
        usersSnapshot.forEach((userSnapshot) => {
            const loans = userSnapshot.val().loans;
            if (loans) {
                Object.values(loans).forEach((loan) => {
                    if (loan.status === 'Pending') pending++;
                });
            }
        });
        updateStat('pendingLoans', pending);
    });
}

function updateStat(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function loadUsers() {
    const usersRef = firebase.database().ref('users');
    const usersTable = document.getElementById('usersTableBody');
    if (!usersTable) return;

    usersRef.on('value', (snapshot) => {
        usersTable.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const userId = childSnapshot.key;
            const row = document.createElement('tr');
            row.className = 'border-b hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4">${user.firstName || ''} ${user.lastName || ''}</td>
                <td class="px-6 py-4">${user.email || ''}</td>
                <td class="px-6 py-4">${user.accountNumber || ''}</td>
                <td class="px-6 py-4 font-semibold">${formatCurrency(user.balance || 0)}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded text-xs ${user.kycVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.kycVerified ? 'Verified' : 'Not Verified'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <button onclick="fundUser('${userId}')" class="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600 text-sm">Fund</button>
                    <button onclick="deductUser('${userId}')" class="bg-orange-500 text-white px-3 py-1 rounded mr-2 hover:bg-orange-600 text-sm">Deduct</button>
                    <button onclick="viewUserDetails('${userId}')" class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">View</button>
                </td>
            `;
            usersTable.appendChild(row);
        });
    });
}

window.fundUser = function(userId) {
    const amount = prompt('Enter amount to fund:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return alert('Invalid amount');
    
    firebase.database().ref(`users/${userId}/balance`).transaction((current) => (current || 0) + parseFloat(amount))
    .then(() => {
        alert('User funded successfully!');
        firebase.database().ref(`users/${userId}/transactions`).push({
            type: 'Admin Credit',
            amount: parseFloat(amount),
            status: 'Approved',
            category: 'Credit',
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            description: 'Account funded by admin'
        });
    }).catch(err => alert('Failed: ' + err.message));
};

window.deductUser = function(userId) {
    const amount = prompt('Enter amount to deduct:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return alert('Invalid amount');
    
    firebase.database().ref(`users/${userId}/balance`).once('value').then((snapshot) => {
        const currentBalance = snapshot.val() || 0;
        if (parseFloat(amount) > currentBalance) return alert('Amount exceeds balance');
        
        firebase.database().ref(`users/${userId}/balance`).transaction((current) => (current || 0) - parseFloat(amount))
        .then(() => {
            alert('Deducted successfully!');
            firebase.database().ref(`users/${userId}/transactions`).push({
                type: 'Admin Debit',
                amount: parseFloat(amount),
                status: 'Approved',
                category: 'Debit',
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                description: 'Deducted by admin'
            });
        });
    });
};

window.viewUserDetails = function(userId) {
    firebase.database().ref(`users/${userId}`).once('value').then((snapshot) => {
        const user = snapshot.val();
        alert(`User Details:\n━━━━━━━━━━━━━━━━\nName: ${user.firstName || ''} ${user.lastName || ''}\nEmail: ${user.email || ''}\nAccount: ${user.accountNumber || ''}\nBalance: ${formatCurrency(user.balance || 0)}\nKYC: ${user.kycVerified ? 'Verified' : 'Not Verified'}`);
    });
};

function loadTransactions() {
    const table = document.getElementById('transactionsTableBody');
    if (!table) return;

    firebase.database().ref('users').on('value', (usersSnapshot) => {
        table.innerHTML = '';
        let count = 0;
        usersSnapshot.forEach((userSnapshot) => {
            const userId = userSnapshot.key;
            const user = userSnapshot.val();
            const txs = user.transactions;
            if (txs) {
                Object.keys(txs).forEach((txId) => {
                    const tx = txs[txId];
                    count++;
                    let beneficiary = tx.accountName || tx.beneficiaryName || (tx.walletAddress ? tx.walletAddress.substring(0,15)+'...' : tx.paypalEmail || '-');
                    table.innerHTML += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm">${user.email || 'Unknown'}</td>
                            <td class="px-6 py-4 text-sm">${tx.type || 'N/A'}</td>
                            <td class="px-6 py-4 font-semibold text-sm">${formatCurrency(tx.amount || 0)}</td>
                            <td class="px-6 py-4 text-sm">${beneficiary}</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${getStatusColor(tx.status)}">${tx.status || 'Pending'}</span></td>
                            <td class="px-6 py-4 text-sm">${formatDate(tx.timestamp || tx.date)}</td>
                            <td class="px-6 py-4">${tx.status === 'Pending' ? `
                                <button onclick="approveTransaction('${userId}','${txId}')" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1">Approve</button>
                                <button onclick="rejectTransaction('${userId}','${txId}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                            ` : '<span class="text-xs text-gray-500">No actions</span>'}</td>
                        </tr>
                    `;
                });
            }
        });
        if (count === 0) table.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500">No transactions</td></tr>';
    });
}

window.approveTransaction = function(userId, txId) {
    if (!confirm('Approve this transaction?')) return;
    const txRef = firebase.database().ref(`users/${userId}/transactions/${txId}`);
    txRef.once('value').then(snapshot => {
        const tx = snapshot.val();
        if (!tx) return alert('Transaction not found');
        txRef.update({ status: 'Approved' }).then(() => {
            const balanceRef = firebase.database().ref(`users/${userId}/balance`);
            if (tx.category === 'Debit' || tx.type.includes('Transfer') || tx.type.includes('withdrawal')) {
                balanceRef.transaction(current => (current || 0) - tx.amount);
            } else if (tx.category === 'Credit' || tx.type.includes('Deposit')) {
                balanceRef.transaction(current => (current || 0) + tx.amount);
            }
            alert('Transaction approved!');
            loadStatistics();
        });
    });
};

window.rejectTransaction = function(userId, txId) {
    if (!confirm('Reject?')) return;
    firebase.database().ref(`users/${userId}/transactions/${txId}`).update({ status: 'Rejected' })
    .then(() => { alert('Rejected'); loadStatistics(); });
};

function loadDeposits() {
    const table = document.getElementById('depositsTableBody');
    if (!table) return;
    firebase.database().ref('users').on('value', (usersSnapshot) => {
        table.innerHTML = '';
        let count = 0;
        usersSnapshot.forEach((userSnapshot) => {
            const userId = userSnapshot.key;
            const user = userSnapshot.val();
            const txs = user.transactions;
            if (txs) {
                Object.keys(txs).forEach((txId) => {
                    const tx = txs[txId];
                    if (tx.type && tx.type.toLowerCase().includes('deposit')) {
                        count++;
                        let details = tx.cardLast4 ? 'Card: ****'+tx.cardLast4 : (tx.cryptoType ? tx.cryptoType.toUpperCase() : '-');
                        table.innerHTML += `
                            <tr class="border-b hover:bg-gray-50">
                                <td class="px-6 py-4 text-sm">${user.email || 'Unknown'}</td>
                                <td class="px-6 py-4 text-sm">${tx.type}</td>
                                <td class="px-6 py-4 font-semibold text-sm">${formatCurrency(tx.amount)}</td>
                                <td class="px-6 py-4 text-sm">${details}</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${getStatusColor(tx.status)}">${tx.status}</span></td>
                                <td class="px-6 py-4 text-sm">${formatDate(tx.timestamp || tx.date)}</td>
                                <td class="px-6 py-4">${tx.status === 'Pending' ? `
                                    <button onclick="approveTransaction('${userId}','${txId}')" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1">Approve</button>
                                    <button onclick="rejectTransaction('${userId}','${txId}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                                ` : '<span class="text-xs text-gray-500">No actions</span>'}</td>
                            </tr>
                        `;
                    }
                });
            }
        });
        if (count === 0) table.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500">No deposits</td></tr>';
    });
}

function loadLoans() {
    const table = document.getElementById('loansTableBody');
    if (!table) return;
    firebase.database().ref('users').on('value', (usersSnapshot) => {
        table.innerHTML = '';
        let count = 0;
        usersSnapshot.forEach((userSnapshot) => {
            const userId = userSnapshot.key;
            const user = userSnapshot.val();
            const loans = user.loans;
            if (loans) {
                Object.keys(loans).forEach((loanId) => {
                    const loan = loans[loanId];
                    count++;
                    table.innerHTML += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm">${user.email || 'Unknown'}</td>
                            <td class="px-6 py-4 font-semibold text-sm">${formatCurrency(loan.amount)}</td>
                            <td class="px-6 py-4 text-sm">${loan.purpose || loan.type || 'N/A'}</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${getStatusColor(loan.status)}">${loan.status || 'Pending'}</span></td>
                            <td class="px-6 py-4 text-sm">${formatDate(loan.timestamp || loan.dateApplied)}</td>
                            <td class="px-6 py-4">${loan.status === 'Pending' ? `
                                <button onclick="approveLoan('${userId}','${loanId}')" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1">Approve</button>
                                <button onclick="rejectLoan('${userId}','${loanId}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                            ` : '<span class="text-xs text-gray-500">No actions</span>'}</td>
                        </tr>
                    `;
                });
            }
        });
        if (count === 0) table.innerHTML = '<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">No loans</td></tr>';
    });
}

window.approveLoan = function(userId, loanId) {
    if (!confirm('Approve loan?')) return;
    const loanRef = firebase.database().ref(`users/${userId}/loans/${loanId}`);
    loanRef.once('value').then(snapshot => {
        const loan = snapshot.val();
        if (!loan) return alert('Loan not found');
        loanRef.update({ status: 'Approved' }).then(() => {
            firebase.database().ref(`users/${userId}/balance`).transaction(current => (current || 0) + loan.amount);
            firebase.database().ref(`users/${userId}/transactions`).push({
                type: 'Loan Approved',
                amount: loan.amount,
                status: 'Approved',
                category: 'Credit',
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                description: `Loan: ${loan.purpose || 'N/A'}`
            });
            alert('Loan approved!');
            loadStatistics();
        });
    });
};

window.rejectLoan = function(userId, loanId) {
    if (!confirm('Reject?')) return;
    firebase.database().ref(`users/${userId}/loans/${loanId}`).update({ status: 'Rejected' })
    .then(() => { alert('Rejected'); loadStatistics(); });
};

function loadCardApplications() {
    const table = document.getElementById('cardsTableBody');
    if (!table) return;
    firebase.database().ref('users').on('value', (usersSnapshot) => {
        table.innerHTML = '';
        let count = 0;
        usersSnapshot.forEach((userSnapshot) => {
            const userId = userSnapshot.key;
            const user = userSnapshot.val();
            const cards = user.cardApplications;
            if (cards) {
                Object.keys(cards).forEach((cardId) => {
                    const card = cards[cardId];
                    count++;
                    table.innerHTML += `
                        <tr class="border-b hover:bg-gray-50">
                            <td class="px-6 py-4 text-sm">${user.email || 'Unknown'}</td>
                            <td class="px-6 py-4 text-sm">${card.cardType ? card.cardType.toUpperCase() : 'N/A'}</td>
                            <td class="px-6 py-4 text-sm">${card.cardLevel || 'Standard'}</td>
                            <td class="px-6 py-4 text-sm">${card.cardholderName || 'N/A'}</td>
                            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${getStatusColor(card.status)}">${card.status || 'Pending'}</span></td>
                            <td class="px-6 py-4 text-sm">${formatDate(card.timestamp || card.requestedAt)}</td>
                            <td class="px-6 py-4">${card.status === 'Pending' ? `
                                <button onclick="approveCard('${userId}','${cardId}')" class="bg-green-500 text-white px-2 py-1 rounded text-xs mr-1">Approve</button>
                                <button onclick="rejectCard('${userId}','${cardId}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                            ` : '<span class="text-xs text-gray-500">No actions</span>'}</td>
                        </tr>
                    `;
                });
            }
        });
        if (count === 0) table.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500">No cards</td></tr>';
    });
}

window.approveCard = function(userId, cardId) {
    if (!confirm('Approve card?')) return;
    const cardRef = firebase.database().ref(`users/${userId}/cardApplications/${cardId}`);
    cardRef.once('value').then(snapshot => {
        const card = snapshot.val();
        if (!card) return alert('Card not found');
        cardRef.update({
            status: 'Approved',
            cardNumber: generateCardNumber(card.cardType),
            cvv: generateCVV(),
            expiryDate: generateExpiryDate()
        }).then(() => {
            firebase.database().ref(`users/${userId}/balance`).transaction(current => (current || 0) - (card.fee || 0));
            firebase.database().ref(`users/${userId}/transactions`).push({
                type: 'Card Fee',
                amount: card.fee || 0,
                status: 'Approved',
                category: 'Debit',
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                description: `${card.cardLevel} ${card.cardType} card`
            });
            alert('Card approved!');
        });
    });
};

window.rejectCard = function(userId, cardId) {
    if (!confirm('Reject?')) return;
    firebase.database().ref(`users/${userId}/cardApplications/${cardId}`).update({ status: 'Rejected' })
    .then(() => alert('Rejected'));
};

function loadSettings() {
    firebase.database().ref('admin/depositBankDetails').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('bankName').value = data.bankName || '';
            document.getElementById('accountNumber').value = data.accountNumber || '';
            document.getElementById('accountName').value = data.accountName || '';
        }
    });
    firebase.database().ref('admin/cryptoWallets').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            document.getElementById('btcWallet').value = data.btc || '';
            document.getElementById('ethWallet').value = data.eth || '';
            document.getElementById('usdtWallet').value = data.usdt || '';
            document.getElementById('usdcWallet').value = data.usdc || '';
        }
    });
}

function setupAdminEventListeners() {
    const bankForm = document.getElementById('bankSettingsForm');
    if (bankForm) {
        bankForm.addEventListener('submit', (e) => {
            e.preventDefault();
            firebase.database().ref('admin/depositBankDetails').set({
                bankName: document.getElementById('bankName').value,
                accountNumber: document.getElementById('accountNumber').value,
                accountName: document.getElementById('accountName').value,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                updatedBy: adminUser.uid
            }).then(() => alert('Bank details updated!')).catch(e => alert('Error: '+e.message));
        });
    }
    
    const cryptoForm = document.getElementById('cryptoSettingsForm');
    if (cryptoForm) {
        cryptoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            firebase.database().ref('admin/cryptoWallets').set({
                btc: document.getElementById('btcWallet').value,
                eth: document.getElementById('ethWallet').value,
                usdt: document.getElementById('usdtWallet').value,
                usdc: document.getElementById('usdcWallet').value,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                updatedBy: adminUser.uid
            }).then(() => alert('Crypto wallets updated!')).catch(e => alert('Error: '+e.message));
        });
    }
    
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            firebase.auth().signOut().then(() => window.location.href = 'admin-login.html');
        });
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
}

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getStatusColor(status) {
    const s = status?.toLowerCase();
    if (s === 'approved') return 'bg-green-100 text-green-800';
    if (s === 'rejected') return 'bg-red-100 text-red-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
}

function generateCardNumber(type) {
    let prefix = '4';
    if (type === 'mastercard') prefix = '5';
    else if (type === 'amex') prefix = '3';
    return prefix + Array.from({length: 15}, () => Math.floor(Math.random() * 10)).join('');
}

function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiryDate() {
    const date = new Date();
    return (date.getMonth() + 1).toString().padStart(2, '0') + '/' + (date.getFullYear() + 3).toString().slice(-2);
}
