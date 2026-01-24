// Firebase Configuration
 const firebaseConfig = {
  apiKey: "AIzaSyBN0h_1Azi5l8jlU7sCC7ZbpsZi5x5BqiI",
  authDomain: "calivra-4bca2.firebaseapp.com",
  databaseURL: "https://calivra-4bca2-default-rtdb.firebaseio.com",
  projectId: "calivra-4bca2",
  storageBucket: "calivra-4bca2.firebasestorage.app",
  messagingSenderId: "1002372257300",
  appId: "1:1002372257300:web:ffacb3d683c408b09ef901",
  measurementId: "G-26PQGX9XZ8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = firebase.auth();

// Initialize Firebase Realtime Database
const database = firebase.database();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { auth, database };
}