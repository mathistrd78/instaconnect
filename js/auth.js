// auth.js - Gestion de l'authentification
const authManager = {
    currentUser: null,
    inactivityTimer: null,
    inactivityTimeout: 10 * 60 * 1000, // 10 minutes en millisecondes

    // Vérifier si un utilisateur est connecté
    checkAuth() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ User logged in:', user.email);
                    this.showApp();
                    this.loadUserData();
                    this.startInactivityTimer();
                    this.setupActivityListeners();
                    resolve(true);
                } else {
                    console.log('❌ No user logged in');
                    this.showAuth();
                    resolve(false);
                }
            });
        });
    },

    // Gérer le timer d'inactivité
    startInactivityTimer() {
        // Récupérer la dernière activité depuis localStorage
        const lastActivity = localStorage.getItem('lastActivity');
        const now = Date.now();
        
        if (lastActivity) {
            const timeSinceLastActivity = now - parseInt(lastActivity);
            
            // Si plus de 10 minutes d'inactivité, déconnecter
            if (timeSinceLastActivity > this.inactivityTimeout) {
                console.log('⏱️ Inactivity timeout detected - logging out');
                this.logout();
                return;
            }
        }
        
        // Mettre à jour la dernière activité
        localStorage.setItem('lastActivity', now.toString());
        this.resetInactivityTimer();
    },

    resetInactivityTimer() {
        // Effacer le timer existant
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        // Mettre à jour la dernière activité dans localStorage
        localStorage.setItem('lastActivity', Date.now().toString());

        // Créer un nouveau timer
        this.inactivityTimer = setTimeout(() => {
            console.log('⏱️ Inactivity timeout - logging out');
            this.logout();
        }, this.inactivityTimeout);
    },

    setupActivityListeners() {
        // Réinitialiser le timer à chaque activité utilisateur
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (this.currentUser) {
                    this.resetInactivityTimer();
                }
            }, true);
        });
    },

    // Afficher la page de connexion
    showAuth() {
        document.getElementById('authPage').style.display = 'flex';
        document.getElementById('appPage').style.display = 'none';
    },

    // Afficher l'application
    showApp() {
        document.getElementById('authPage').style.display = 'none';
        document.getElementById('appPage').style.display = 'block';
        
        // Afficher l'email de l'utilisateur
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl && this.currentUser) {
            userEmailEl.textContent = this.currentUser.email;
        }
    },

    // Inscription
    async signup(email, password) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            console.log('✅ Signup successful:', userCredential.user.email);
            
            // Migrer les données localStorage vers Firebase
            await this.migrateLocalData();
            
            return { success: true };
        } catch (error) {
            console.error('❌ Signup error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Connexion
    async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Login successful:', userCredential.user.email);
            return { success: true };
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Déconnexion
    async logout() {
        try {
            // Effacer le timer d'inactivité
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
                this.inactivityTimer = null;
            }

            // Nettoyer le localStorage de l'activité
            localStorage.removeItem('lastActivity');

            await auth.signOut();
            console.log('✅ Logout successful');
            this.showAuth();
        } catch (error) {
            console.error('❌ Logout error:', error);
            alert('Erreur lors de la déconnexion');
        }
    },

    // Réinitialisation du mot de passe
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('❌ Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    },

    // Migrer les données localStorage vers Firebase
    async migrateLocalData() {
        try {
            const localContacts = localStorage.getItem('instaConnectContacts');
            const localTags = localStorage.getItem('instaConnectCustomTags');
            const normalUnfollowers = localStorage.getItem('normalUnfollowers');
            const doNotFollowList = localStorage.getItem('doNotFollowList');

            if (localContacts || localTags || normalUnfollowers || doNotFollowList) {
                console.log('📦 Migrating local data to Firebase...');
                
                const userId = this.currentUser.uid;
                const batch = db.batch();

                // Sauvegarder les contacts
                if (localContacts) {
                    const contacts = JSON.parse(localContacts);
                    const contactsRef = db.collection('users').doc(userId).collection('contacts');
                    contacts.forEach(contact => {
                        batch.set(contactsRef.doc(contact.id), contact);
                    });
                }

                // Sauvegarder les tags personnalisés
                if (localTags) {
                    const userDoc = db.collection('users').doc(userId);
                    batch.set(userDoc, {
                        customTags: JSON.parse(localTags)
                    }, { merge: true });
                }

                // Sauvegarder les unfollowers normaux
                if (normalUnfollowers) {
                    const userDoc = db.collection('users').doc(userId);
                    batch.set(userDoc, {
                        normalUnfollowers: JSON.parse(normalUnfollowers)
                    }, { merge: true });
                }
                
                // Sauvegarder la liste "à ne plus suivre"
                if (doNotFollowList) {
                    const userDoc = db.collection('users').doc(userId);
                    batch.set(userDoc, {
                        doNotFollowList: JSON.parse(doNotFollowList)
                    }, { merge: true });
                }

                await batch.commit();
                console.log('✅ Local data migrated to Firebase');

                // Nettoyer le localStorage après migration réussie
                localStorage.removeItem('instaConnectContacts');
                localStorage.removeItem('instaConnectCustomTags');
            }
        } catch (error) {
            console.error('❌ Migration error:', error);
        }
    },

    // Charger les données utilisateur depuis Firebase
    async loadUserData() {
        try {
            const userId = this.currentUser.uid;

            // Charger les tags personnalisés et unfollowers normaux
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data.customTags) {
                    app.customTags = data.customTags;
                    
                    // Recreate CSS styles for custom tags
                    console.log('🎨 Recreating CSS styles for custom tags...');
                    Object.keys(app.customTags).forEach(fieldType => {
                        app.customTags[fieldType].forEach(tag => {
                            if (tag.class) {
                                // If color not saved, try to get it from existing CSS
                                if (!tag.color) {
                                    const existingStyle = document.getElementById('style-' + tag.class);
                                    if (existingStyle) {
                                        const cssText = existingStyle.textContent;
                                        const match = cssText.match(/background:\s*(#[0-9a-fA-F]{6})/);
                                        if (match) {
                                            tag.color = match[1];
                                            console.log('🔄 Initialized color from CSS for', tag.label, ':', match[1]);
                                        }
                                    }
                                }
                                
                                const styleId = 'style-' + tag.class;
                                
                                // Remove old style if exists
                                const oldStyle = document.getElementById(styleId);
                                if (oldStyle) oldStyle.remove();
                                
                                // Create new style
                                const styleElement = document.createElement('style');
                                styleElement.id = styleId;
                                document.head.appendChild(styleElement);
                                
                                const color = tag.color || '#868e96';
                                styleElement.textContent = `.${tag.class} { background: ${color}; color: white; }`;
                                console.log('✅ Style created for', tag.label, ':', color);
                            }
                        });
                    });
                    
                    console.log('✅ Custom tags loaded and styles created');
                }
                if (data.normalUnfollowers) {
                    unfollowers.data.normalUnfollowers = new Set(data.normalUnfollowers);
                }
                if (data.doNotFollowList) {
                    unfollowers.data.doNotFollowList = new Set(data.doNotFollowList);
                }
                if (data.normalCategories) {
                    unfollowers.data.normalCategories = data.normalCategories;
                }
                
                // Charger les données des unfollowers (following, followers, unfollowers)
                if (data.unfollowersData) {
                    unfollowers.data.following = data.unfollowersData.following || [];
                    unfollowers.data.followers = data.unfollowersData.followers || [];
                    unfollowers.data.unfollowers = data.unfollowersData.unfollowers || [];
                    
                    // Update display
                    document.getElementById('followersCount').textContent = unfollowers.data.followers.length;
                    document.getElementById('followingCount').textContent = unfollowers.data.following.length;
                    document.getElementById('unfollowersCount').textContent = unfollowers.data.unfollowers.length;
                    
                    // Show appropriate section
                    if (unfollowers.data.unfollowers.length === 0) {
                        document.getElementById('unfollowersResults').style.display = 'none';
                        document.getElementById('emptyUnfollowers').style.display = 'block';
                        const emptyDiv2 = document.getElementById('emptyUnfollowers').querySelector('div:nth-child(2)');
                        const emptyDiv3 = document.getElementById('emptyUnfollowers').querySelector('div:nth-child(3)');
                        if (emptyDiv2) emptyDiv2.textContent = 'Aucun unfollower !';
                        if (emptyDiv3) emptyDiv3.textContent = 'Tout le monde que vous suivez vous suit en retour';
                    } else {
                        document.getElementById('unfollowersResults').style.display = 'block';
                        document.getElementById('emptyUnfollowers').style.display = 'none';
                        unfollowers.renderList();
                    }
                    
                    console.log('✅ Unfollowers data loaded:', unfollowers.data.unfollowers.length, 'unfollowers');
                }
                
                // Update counts
                unfollowers.updateCounts();
            }

            // Charger les contacts UNE SEULE FOIS au démarrage (pas de listener temps réel)
            const contactsSnapshot = await db.collection('users').doc(userId).collection('contacts').get();
            
            app.dataStore.contacts = [];
            contactsSnapshot.forEach(doc => {
                app.dataStore.contacts.push(doc.data());
            });
            
            console.log('✅ Contacts loaded from Firebase:', app.dataStore.contacts.length);
            
            // Re-render UI
            contacts.render();
            stats.render();

        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    },

    // Messages d'erreur en français
    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'Cet email est déjà utilisé',
            'auth/invalid-email': 'Email invalide',
            'auth/weak-password': 'Mot de passe trop faible (min. 6 caractères)',
            'auth/user-not-found': 'Utilisateur introuvable',
            'auth/wrong-password': 'Mot de passe incorrect',
            'auth/too-many-requests': 'Trop de tentatives, réessayez plus tard',
            'auth/network-request-failed': 'Erreur réseau'
        };
        return messages[code] || 'Une erreur est survenue';
    }
};

// Déconnexion automatique uniquement lors de la fermeture définitive de l'onglet (desktop)
// Sur mobile, l'app reste connectée sauf si 10 minutes d'inactivité
window.addEventListener('beforeunload', () => {
    if (authManager.currentUser) {
        // Sur desktop, déconnecter à la fermeture de l'onglet
        // Sur mobile, cet événement ne se déclenche généralement pas, ce qui est voulu
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) {
            auth.signOut();
        }
    }
});
