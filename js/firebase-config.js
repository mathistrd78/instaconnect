// firebase-config.js - Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAw4Fa6eWt5IDLVjWe4_M6C48Pqe7A8IaY",
    authDomain: "instaconnect-62ba5.firebaseapp.com",
    projectId: "instaconnect-62ba5",
    storageBucket: "instaconnect-62ba5.firebasestorage.app",
    messagingSenderId: "821509841039",
    appId: "1:821509841039:web:e3f10cf19f841d772dd0fa"
};

// Initialize Firebase
let firebaseApp;
let auth;
let db;

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return false;
    }
    
    try {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        
        // Configurer la persistence SESSION : déconnexion automatique à la fermeture de l'app
        // Mais on garde la session active si l'app passe en arrière-plan
        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .then(() => {
                console.log('✅ Firebase persistence set to SESSION');
            })
            .catch((error) => {
                console.error('❌ Error setting persistence:', error);
            });
        
        db = firebase.firestore();
        console.log('✅ Firebase initialized');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}
