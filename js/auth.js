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
            
            // NE PLUS migrer automatiquement - tous les nouveaux users partent de zéro
            console.log('✨ New user created - starting fresh with empty data');
            
            // Initialiser Firebase avec des données vides pour ce nouveau user
            const userId = userCredential.user.uid;
            const cleanDefaultFields = app.defaultFields.map(f => {
                const cleanField = {
                    id: f.id,
                    type: f.type,
                    label: f.label,
                    required: f.required,
                    order: f.order
                };
                
                if (f.placeholder) cleanField.placeholder = f.placeholder;
                if (f.options) cleanField.options = f.options;
                if (f.type === 'select') cleanField.tags = [];
                
                return cleanField;
            });
            
            await db.collection('users').doc(userId).set({
                customTags: {
                    relationType: [],
                    meetingPlace: [],
                    discussionStatus: []
                },
                customFields: [],
                defaultFields: cleanDefaultFields,
                normalUnfollowers: [],
                doNotFollowList: []
            });
            
            console.log('✅ New user initialized in Firebase with empty data');
            
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
            
            // Marquer qu'on vient de se déconnecter manuellement (pour éviter la landing page)
            localStorage.setItem('justLoggedOut', 'true');
            
            // VIDER LE LOCALSTORAGE pour éviter la contamination entre comptes
            console.log('🧹 Cleaning localStorage...');
            localStorage.removeItem('instaConnectContacts');
            localStorage.removeItem('instaConnectCustomTags');
            localStorage.removeItem('normalUnfollowers');
            localStorage.removeItem('doNotFollowList');
            console.log('✅ LocalStorage cleaned');
            
            // NETTOYAGE COMPLET DES DONNÉES EN MÉMOIRE
            console.log('🧹 Cleaning up user data...');
            
            // Vider les contacts
            app.dataStore.contacts = [];
            
            // Vider les relations
            relations.data = {
                followers: [],
                following: [],
                unfollowers: [],
                fans: [],
                pending: [],
                normalUnfollowers: new Set(),
                doNotFollowList: new Set(),
                marked: new Set(),
                normalCategories: {},
                currentTab: 'unfollowers'
            };
            
            // Réinitialiser les tags par défaut (pour éviter contamination)
            app.defaultTags = {
                relationType: [],
                meetingPlace: [],
                discussionStatus: []
            };
            
            // Réinitialiser les tags personnalisés
            app.customTags = {
                relationType: [],
                meetingPlace: [],
                discussionStatus: []
            };
            
            // Réinitialiser les champs personnalisés
            app.customFields = [];
            
            // Réinitialiser les champs par défaut (vider leurs tags)
            app.defaultFields.forEach(field => {
                if (field.type === 'select') {
                    field.tags = [];
                }
            });
            
            console.log('✅ User data cleaned');

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
    async loadUserData(forceReload = false) {
        try {
            const userId = this.currentUser.uid;
            
            // Si les données sont déjà chargées et qu'on ne force pas le reload, skip
            if (!forceReload && app.dataStore.contacts.length > 0) {
                console.log('⏭️ Data already loaded, skipping reload');
                return;
            }

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
                
                // Charger les champs personnalisés
                if (data.customFields) {
                    app.customFields = data.customFields;
                    console.log('✅ Custom fields loaded:', app.customFields.length);
                }
                
                // Charger les champs par défaut (avec leurs tags personnalisés)
                if (data.defaultFields) {
                    app.defaultFields = data.defaultFields;
                    console.log('✅ Default fields loaded with user tags');
                    
                    // MIGRATION FORCÉE : Mettre à jour la structure des champs (UNE SEULE FOIS)
                    // Vérifier si la migration a déjà été faite
                    const needsMigration = 
                        app.defaultFields.find(f => f.id === 'profession') || 
                        app.defaultFields.find(f => f.id === 'interests') ||
                        !app.defaultFields.find(f => f.id === 'birthday') ||
                        (app.defaultFields.find(f => f.id === 'birthYear')?.type !== 'year');
                    
                    if (needsMigration) {
                        console.log('🔄 Migration needed - updating field structure...');
                        
                        // Supprimer les champs profession et interests s'ils existent
                        app.defaultFields = app.defaultFields.filter(f => f.id !== 'profession' && f.id !== 'interests');
                        
                        // Renommer Ville en Localisation
                        const locationField = app.defaultFields.find(f => f.id === 'location');
                        if (locationField) {
                            locationField.label = 'Localisation';
                            locationField.type = 'city';
                        }
                        
                        // Changer birthYear en type year
                        const birthYearField = app.defaultFields.find(f => f.id === 'birthYear');
                        if (birthYearField) {
                            birthYearField.type = 'year';
                            birthYearField.order = 5;
                        }
                        
                        // Ajouter le champ birthday s'il n'existe pas
                        if (!app.defaultFields.find(f => f.id === 'birthday')) {
                            console.log('➕ Adding birthday field...');
                            app.defaultFields.push({
                                id: 'birthday',
                                type: 'date',
                                label: 'Date d\'anniversaire',
                                required: false,
                                order: 6,
                                futureOnly: false
                            });
                        }
                        
                        // Réajuster les ordres
                        const notesField = app.defaultFields.find(f => f.id === 'notes');
                        if (notesField) notesField.order = 7;
                        
                        const meetingField = app.defaultFields.find(f => f.id === 'meetingDate');
                        if (meetingField) meetingField.order = 8;
                        
                        // Sauvegarder les modifications UNE SEULE FOIS
                        console.log('💾 Saving updated defaultFields to Firebase...');
                        db.collection('users').doc(userId).update({
                            defaultFields: app.defaultFields
                        }).then(() => {
                            console.log('✅ DefaultFields structure updated in Firebase - migration complete!');
                        }).catch(err => {
                            console.error('❌ Error updating defaultFields:', err);
                        });
                    } else {
                        console.log('✅ Field structure already up-to-date, no migration needed');
                    }
                    
                    // Recréer les styles CSS pour tous les tags dans field.tags
                    console.log('🎨 Recreating CSS styles for field tags...');
                    app.defaultFields.forEach(field => {
                        if (field.type === 'select' && field.tags) {
                            field.tags.forEach(tag => {
                                if (tag.class && tag.color) {
                                    const styleId = 'style-' + tag.class;
                                    let styleElement = document.getElementById(styleId);
                                    if (!styleElement) {
                                        styleElement = document.createElement('style');
                                        styleElement.id = styleId;
                                        document.head.appendChild(styleElement);
                                    }
                                    styleElement.textContent = `.${tag.class} { background: ${tag.color}; color: white; }`;
                                    console.log('✅ Style created for', tag.label, ':', tag.color);
                                }
                            });
                        }
                    });
                } else {
                    // Pas de defaultFields dans Firebase
                    // Si l'utilisateur a des customTags, c'est un ancien user → migrer
                    // Sinon c'est un nouveau user → laisser vide
                    const hasCustomTags = data.customTags && (
                        (data.customTags.relationType && data.customTags.relationType.length > 0) ||
                        (data.customTags.meetingPlace && data.customTags.meetingPlace.length > 0) ||
                        (data.customTags.discussionStatus && data.customTags.discussionStatus.length > 0)
                    );
                    
                    if (hasCustomTags) {
                        console.log('🔄 Old user detected - migrating tags to new field system...');
                        app.migrateToNewFieldSystem();
                    } else {
                        console.log('✨ New user detected - starting with empty tags');
                        // S'assurer que les defaultFields ont bien des tags vides
                        app.defaultFields.forEach(field => {
                            if (field.type === 'select') {
                                field.tags = [];
                            }
                        });
                    }
                }
                
                // MIGRATION: Mettre à jour le champ location en type city
                const locationField = app.defaultFields.find(f => f.id === 'location');
                if (locationField && locationField.type !== 'city') {
                    console.log('🔄 Migrating location field to type city...');
                    locationField.type = 'city';
                    locationField.label = 'Ville';
                    
                    // Sauvegarder immédiatement
                    try {
                        const userDoc = db.collection('users').doc(userId);
                        const cleanDefaultFields = app.defaultFields.map(f => {
                            const clean = { ...f };
                            Object.keys(clean).forEach(key => {
                                if (clean[key] === undefined) delete clean[key];
                            });
                            return clean;
                        });
                        await userDoc.set({
                            defaultFields: cleanDefaultFields
                        }, { merge: true });
                        console.log('✅ Location field migrated successfully');
                    } catch (error) {
                        console.error('❌ Error migrating location field:', error);
                    }
                }
                
                // MIGRATION: Ajouter le champ meetingDate (RDV) s'il n'existe pas
                const meetingDateField = app.defaultFields.find(f => f.id === 'meetingDate');
                if (!meetingDateField) {
                    console.log('🔄 Adding meetingDate field...');
                    app.defaultFields.push({
                        id: 'meetingDate',
                        type: 'date',
                        label: 'RDV',
                        required: false,
                        order: 9,
                        futureOnly: true
                    });
                    
                    // Sauvegarder immédiatement
                    try {
                        const userDoc = db.collection('users').doc(userId);
                        const cleanDefaultFields = app.defaultFields.map(f => {
                            const clean = { ...f };
                            Object.keys(clean).forEach(key => {
                                if (clean[key] === undefined) delete clean[key];
                            });
                            return clean;
                        });
                        await userDoc.set({
                            defaultFields: cleanDefaultFields
                        }, { merge: true });
                        console.log('✅ MeetingDate field added successfully');
                    } catch (error) {
                        console.error('❌ Error adding meetingDate field:', error);
                    }
                }
                
                if (data.normalUnfollowers) {
                    relations.data.normalUnfollowers = new Set(data.normalUnfollowers);
                }
                if (data.doNotFollowList) {
                    relations.data.doNotFollowList = new Set(data.doNotFollowList);
                }
                if (data.normalCategories) {
                    relations.data.normalCategories = data.normalCategories;
                }
                
                // Charger les données des relations (following, followers, unfollowers)
                if (data.unfollowersData) {
                    relations.data.following = data.unfollowersData.following || [];
                    relations.data.followers = data.unfollowersData.followers || [];
                    
                    // ⚠️ IMPORTANT: Refiltrer les unfollowers pour exclure ceux marqués comme normaux ou à ne plus suivre
                    const rawUnfollowers = data.unfollowersData.unfollowers || [];
                    relations.data.unfollowers = rawUnfollowers.filter(item => {
                        const username = typeof item === 'string' ? item : item.username;
                        return !relations.data.normalUnfollowers.has(username) && 
                               !relations.data.doNotFollowList.has(username);
                    });
                    
                    console.log(`🔍 Filtered unfollowers: ${rawUnfollowers.length} -> ${relations.data.unfollowers.length}`);
                    
                    // Update display (compteurs supprimés de l'interface)
                    // document.getElementById('followersCount').textContent = relations.data.followers.length;
                    // document.getElementById('followingCount').textContent = relations.data.following.length;
                    // document.getElementById('unfollowersCount').textContent = relations.data.unfollowers.length;
                    
                    // Show appropriate section
                    if (relations.data.unfollowers.length === 0) {
                        document.getElementById('unfollowersResults').style.display = 'none';
                        document.getElementById('emptyUnfollowers').style.display = 'block';
                        const emptyDiv2 = document.getElementById('emptyUnfollowers').querySelector('div:nth-child(2)');
                        const emptyDiv3 = document.getElementById('emptyUnfollowers').querySelector('div:nth-child(3)');
                        if (emptyDiv2) emptyDiv2.textContent = 'Aucun unfollower !';
                        if (emptyDiv3) emptyDiv3.textContent = 'Tout le monde que vous suivez vous suit en retour';
                    } else {
                        document.getElementById('unfollowersResults').style.display = 'block';
                        document.getElementById('emptyUnfollowers').style.display = 'none';
                        relations.renderList();
                    }
                    
                    console.log('✅ Relations data loaded:', relations.data.unfollowers.length, 'unfollowers');
                }
                
                // Update counts
                relations.updateCounts();
            }

            // Charger les contacts UNE SEULE FOIS au démarrage (pas de listener temps réel)
            const contactsSnapshot = await db.collection('users').doc(userId).collection('contacts').get();
            
            app.dataStore.contacts = [];
            const contactsToDelete = []; // Pour stocker les contacts à supprimer de Firebase
            
            contactsSnapshot.forEach(doc => {
                const contact = doc.data();
                
                // Migration : convertir les anciennes valeurs de gender
                if (contact.gender === 'Homme') {
                    contact.gender = '👨 Homme';
                } else if (contact.gender === 'Femme') {
                    contact.gender = '👩 Femme';
                }
                
                // Migration : nettoyer les champs location corrompus (double stringify)
                if (contact.location && typeof contact.location === 'string') {
                    // Si c'est un JSON stringifié qui commence par "{\"city\""
                    if (contact.location.startsWith('{"') || contact.location.startsWith('{"city"')) {
                        try {
                            // Parser pour récupérer l'objet propre
                            const parsed = JSON.parse(contact.location);
                            contact.location = parsed;
                            console.log('🔧 Cleaned corrupted location for', contact.firstName);
                        } catch (e) {
                            // Si ça échoue, laisser tel quel
                        }
                    }
                }
                
                // Migration : mettre à jour les valeurs des champs radio personnalisés
                if (app.customFields && app.customFields.length > 0) {
                    app.customFields.forEach(field => {
                        if (field.type === 'radio' && field.options && contact[field.id]) {
                            const currentValue = contact[field.id];
                            const currentClean = currentValue.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
                            
                            // Chercher une correspondance dans les options actuelles
                            let matchFound = false;
                            for (const option of field.options) {
                                const optionClean = option.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim().toLowerCase();
                                
                                // Si correspondance exacte (sans emojis)
                                if (currentClean === optionClean) {
                                    if (currentValue !== option) {
                                        console.log(`🔄 Migrating ${field.id} for ${contact.firstName}: "${currentValue}" → "${option}"`);
                                        contact[field.id] = option;
                                    }
                                    matchFound = true;
                                    break;
                                }
                            }
                            
                            // Si aucune correspondance, essayer par position
                            if (!matchFound && field.options.length > 0) {
                                // Chercher dans les anciennes valeurs communes
                                const commonMappings = {
                                    'oui': field.options.find(o => o.toLowerCase().includes('oui')),
                                    'non': field.options.find(o => o.toLowerCase().includes('non')),
                                    'yes': field.options.find(o => o.toLowerCase().includes('yes')),
                                    'no': field.options.find(o => o.toLowerCase().includes('no'))
                                };
                                
                                if (commonMappings[currentClean]) {
                                    console.log(`🔄 Migrating ${field.id} for ${contact.firstName}: "${currentValue}" → "${commonMappings[currentClean]}"`);
                                    contact[field.id] = commonMappings[currentClean];
                                }
                            }
                        }
                    });
                }
                
                // Vérifier si ce contact est dans la liste "À ne plus suivre"
                const instagramUsername = contact.instagram.toLowerCase().replace('@', '');
                if (relations.data.doNotFollowList.has(instagramUsername)) {
                    console.log(`🗑️ Contact @${instagramUsername} is in doNotFollow list - marking for deletion`);
                    contactsToDelete.push(contact.id);
                } else {
                    app.dataStore.contacts.push(contact);
                }
            });
            
            // Supprimer les contacts qui sont dans la liste "doNotFollow" de Firebase
            if (contactsToDelete.length > 0) {
                console.log(`🗑️ Deleting ${contactsToDelete.length} contacts from Firebase...`);
                const batch = db.batch();
                contactsToDelete.forEach(contactId => {
                    const contactRef = db.collection('users').doc(userId).collection('contacts').doc(contactId);
                    batch.delete(contactRef);
                });
                await batch.commit();
                console.log('✅ Contacts deleted from Firebase');
            }
            
            console.log('✅ Contacts loaded from Firebase:', app.dataStore.contacts.length);
            
            // Sauvegarder les contacts migrés dans Firebase (si des migrations ont eu lieu)
            const needsSave = app.dataStore.contacts.some(contact => {
                // Vérifier si au moins un contact a été migré
                return app.customFields && app.customFields.some(field => {
                    if (field.type === 'radio' && field.options && contact[field.id]) {
                        const currentValue = contact[field.id];
                        return field.options.includes(currentValue);
                    }
                    return false;
                });
            });
            
            if (needsSave) {
                console.log('💾 Saving migrated contacts to Firebase...');
                await app.dataStore.save();
            }
            
            // Re-render UI
            contacts.renderFilters(); // Regénérer les filtres avec les champs actuels
            contacts.render();
            stats.renderTabs(); // Regénérer les onglets avec les champs actuels
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
