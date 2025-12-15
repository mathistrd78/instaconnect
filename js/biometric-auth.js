// biometric-auth.js - Authentification biométrique (Face ID / Touch ID / Fingerprint)

const biometricAuth = {
    // Vérifier si la biométrie est disponible
    async isAvailable() {
        if (!window.PublicKeyCredential) {
            console.log('❌ WebAuthn non supporté');
            return false;
        }

        try {
            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            console.log('🔐 Biométrie disponible:', available);
            return available;
        } catch (error) {
            console.error('Erreur détection biométrie:', error);
            return false;
        }
    },

    // Enregistrer l'authentification biométrique après connexion réussie
    async register(userId, userEmail) {
        try {
            console.log('📝 Enregistrement biométrique pour:', userEmail);

            // Générer un challenge aléatoire
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Créer les credentials biométriques
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: {
                        name: "InstaConnect",
                        id: window.location.hostname
                    },
                    user: {
                        id: new TextEncoder().encode(userId),
                        name: userEmail,
                        displayName: userEmail
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: "public-key" },  // ES256
                        { alg: -257, type: "public-key" } // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform", // Biométrie de l'appareil
                        userVerification: "required",
                        requireResidentKey: true
                    },
                    timeout: 60000,
                    attestation: "none"
                }
            });

            if (credential) {
                // Sauvegarder le credential ID dans localStorage
                const credentialData = {
                    credentialId: arrayBufferToBase64(credential.rawId),
                    userId: userId,
                    userEmail: userEmail,
                    registeredAt: new Date().toISOString()
                };

                localStorage.setItem('biometric_credential', JSON.stringify(credentialData));
                localStorage.setItem('biometric_enabled', 'true');
                
                console.log('✅ Biométrie enregistrée avec succès');
                return true;
            }

            return false;
        } catch (error) {
            console.error('❌ Erreur enregistrement biométrie:', error);
            return false;
        }
    },

    // Authentifier avec biométrie
    async authenticate() {
        try {
            // Vérifier si la biométrie est activée
            const biometricEnabled = localStorage.getItem('biometric_enabled') === 'true';
            if (!biometricEnabled) {
                console.log('⚠️ Biométrie non activée');
                return null;
            }

            const credentialDataStr = localStorage.getItem('biometric_credential');
            if (!credentialDataStr) {
                console.log('⚠️ Pas de credential biométrique');
                return null;
            }

            const credentialData = JSON.parse(credentialDataStr);
            console.log('🔐 Tentative d\'authentification biométrique automatique...');

            // Générer un challenge
            const challenge = new Uint8Array(32);
            crypto.getRandomValues(challenge);

            // Demander l'authentification biométrique
            // mediation: "conditional" permet l'authentification automatique
            const assertion = await navigator.credentials.get({
                mediation: "conditional", // Authentification automatique sans clic
                publicKey: {
                    challenge: challenge,
                    timeout: 60000,
                    rpId: window.location.hostname,
                    userVerification: "required"
                }
            });

            if (assertion) {
                console.log('✅ Authentification biométrique réussie');
                
                // Récupérer les données utilisateur sauvegardées
                const savedEmail = localStorage.getItem('user_email');
                const savedPassword = localStorage.getItem('user_password_encrypted');

                if (savedEmail && savedPassword) {
                    // Déchiffrer le mot de passe (simple base64 pour l'instant)
                    const password = atob(savedPassword);
                    
                    return {
                        email: savedEmail,
                        password: password
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('❌ Erreur authentification biométrique:', error);
            
            // Si l'utilisateur annule ou erreur, retourner null
            if (error.name === 'NotAllowedError') {
                console.log('🚫 Utilisateur a annulé l\'authentification');
            }
            
            return null;
        }
    },

    // Désactiver la biométrie
    disable() {
        localStorage.removeItem('biometric_credential');
        localStorage.removeItem('biometric_enabled');
        localStorage.removeItem('user_password_encrypted');
        console.log('🔓 Biométrie désactivée');
    },

    // Vérifier si la biométrie est activée
    isEnabled() {
        return localStorage.getItem('biometric_enabled') === 'true';
    },

    // Sauvegarder les credentials de manière sécurisée
    saveCredentials(email, password) {
        localStorage.setItem('user_email', email);
        // Chiffrement simple (pour production, utiliser un vrai chiffrement)
        localStorage.setItem('user_password_encrypted', btoa(password));
    }
};

// Utilitaires
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
