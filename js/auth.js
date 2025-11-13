// auth.js - Gestion de l'authentification
const authManager = {
    currentUser: null,

    // Vérifier si un utilisateur est connecté
    checkAuth() {
        return new Promise((resolve) => {
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('✅ User logged in:', user.email);
                    this.showApp();
                    this.loadUserData();
                    resolve(true);
                } else {
                    console.log('❌ No user logged in');
                    this.showAuth();
                    resolve(false);
                }
            });
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
                    
                    // Save back to Firebase to persist the initialized colors
                    console.log('💾 Saving initialized colors back to Firebase...');
                    setTimeout(() => {
                        app.dataStore.save();
                    }, 1000);
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

            // Charger les contacts avec écoute en temps réel
            db.collection('users').doc(userId).collection('contacts')
                .onSnapshot((snapshot) => {
                    console.log('🔄 Firebase snapshot received - docChanges:', snapshot.docChanges().length);
                    
                    // Process changes
                    snapshot.docChanges().forEach(change => {
                        const contact = change.doc.data();
                        console.log('🔄 Change type:', change.type, 'Contact:', contact.firstName, 'Gender:', contact.gender);
                        
                        if (change.type === 'added') {
                            // Check if contact already exists (avoid duplicates)
                            const exists = app.dataStore.contacts.find(c => c.id === contact.id);
                            if (!exists) {
                                app.dataStore.contacts.push(contact);
                                console.log('➕ Contact added to local array:', contact.firstName);
                            } else {
                                console.log('⏭️ Contact already exists, skipping add:', contact.firstName);
                            }
                        }
                        
                        if (change.type === 'modified') {
                            const index = app.dataStore.contacts.findIndex(c => c.id === contact.id);
                            if (index !== -1) {
                                console.log('📝 Before update - Gender:', app.dataStore.contacts[index].gender);
                                app.dataStore.contacts[index] = contact;
                                console.log('📝 After update - Gender:', app.dataStore.contacts[index].gender);
                                console.log('✏️ Contact modified in local array:', contact.firstName);
                            } else {
                                console.error('❌ Modified contact not found in local array:', contact.id);
                            }
                        }
                        
                        if (change.type === 'removed') {
                            app.dataStore.contacts = app.dataStore.contacts.filter(c => c.id !== contact.id);
                            console.log('🗑️ Contact removed from local array:', contact.firstName);
                        }
                    });
                    
                    // Re-render UI
                    contacts.render();
                    stats.render();
                    console.log('✅ Total contacts in local array:', app.dataStore.contacts.length);
                });

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
