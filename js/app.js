// app.js - Coordinateur principal
const app = {
    // Configuration des champs par défaut (non supprimables)
    defaultFields: [
        { 
            id: 'relationType', 
            type: 'select', 
            label: 'Type de relation', 
            required: true,
            order: 0,
            tags: [] // Tags définis par l'utilisateur
        },
        { 
            id: 'meetingPlace', 
            type: 'select', 
            label: 'Lieu de rencontre', 
            required: true,
            order: 1,
            tags: []
        },
        { 
            id: 'discussionStatus', 
            type: 'select', 
            label: 'Statut de discussion', 
            required: true,
            order: 2,
            tags: []
        },
        { 
            id: 'gender', 
            type: 'radio', 
            label: 'Sexe', 
            required: true,
            order: 3,
            options: ['👨 Homme', '👩 Femme']
        },
        { 
            id: 'location', 
            type: 'city', 
            label: 'Localisation', 
            required: false,
            order: 4
        },
        { 
            id: 'birthYear', 
            type: 'year', 
            label: 'Année de naissance', 
            required: false,
            order: 5
        },
        { 
            id: 'birthday', 
            type: 'date', 
            label: 'Date d\'anniversaire', 
            required: false,
            order: 6,
            futureOnly: false
        },
        { 
            id: 'notes', 
            type: 'textarea', 
            label: 'Notes personnelles', 
            required: false,
            order: 7
        },
        { 
            id: 'meetingDate', 
            type: 'date', 
            label: 'RDV', 
            required: false,
            order: 8,
            futureOnly: true
        }
    ],

    // Champs personnalisés créés par l'utilisateur
    customFields: [],

    // ANCIEN SYSTÈME - Conservé pour compatibilité avec les anciens users
    // Configuration des tags par défaut (sera migré vers defaultFields[].tags)
    defaultTags: {
        relationType: [
            { value: 'Ami', label: '👥 Ami', class: 'tag-ami' },
            { value: 'Famille', label: '👨‍👩‍👧 Famille', class: 'tag-famille' },
            { value: 'Connaissance', label: '🤝 Connaissance', class: 'tag-connaissance' },
            { value: 'Sexe', label: '❤️ Sexe', class: 'tag-sexe' }
        ],
        meetingPlace: [
            { value: 'IRL', label: '🌍 IRL', class: 'tag-irl' },
            { value: 'Insta', label: '📸 Insta', class: 'tag-insta' },
            { value: 'Tinder', label: '🔥 Tinder', class: 'tag-tinder' },
            { value: 'Hinge', label: '💜 Hinge', class: 'tag-hinge' },
            { value: 'Soirée Tech', label: '🎵 Soirée Tech', class: 'tag-soiree-tech' }
        ],
        discussionStatus: [
            { value: 'Déjà parlé', label: '💬 Déjà parlé', class: 'tag-deja-parle' },
            { value: 'Jamais parlé', label: '🤐 Jamais parlé', class: 'tag-jamais-parle' },
            { value: 'En vu', label: '👀 En vu', class: 'tag-en-vu' },
            { value: 'En cours', label: '📝 En cours', class: 'tag-en-cours' }
        ]
    },

    customTags: {
        relationType: [],
        meetingPlace: [],
        discussionStatus: []
    },

    dataStore: {
        contacts: [],
        
        load() {
            // Les données sont maintenant chargées depuis Firebase dans auth.js
            // Cette fonction est gardée pour compatibilité mais ne fait plus rien
            console.log('📦 Data will be loaded from Firebase');
        },
        
        async save(specificContact = null) {
            // Sauvegarder dans Firebase au lieu de localStorage
            if (!authManager.currentUser) {
                console.warn('⚠️ No user logged in, cannot save to Firebase');
                return;
            }

            try {
                const userId = authManager.currentUser.uid;
                console.log('💾 SAVING to Firebase - User:', userId);

                const batch = db.batch();
                
                if (specificContact) {
                    // Sauvegarder un seul contact
                    console.log('💾 Saving specific contact:', specificContact.id);
                    const contactRef = db.collection('users').doc(userId).collection('contacts').doc(specificContact.id);
                    batch.set(contactRef, specificContact);
                } else if (this.contacts.length > 0) {
                    // Sauvegarder tous les contacts seulement s'il y en a
                    console.log('💾 Saving ALL contacts in batch:', this.contacts.length);
                    const contactsRef = db.collection('users').doc(userId).collection('contacts');
                    this.contacts.forEach(contact => {
                        batch.set(contactsRef.doc(contact.id), contact);
                    });
                }

                // TOUJOURS sauvegarder les tags et champs personnalisés
                console.log('📤 Saving customTags to Firebase:', JSON.stringify(app.customTags));
                console.log('📤 Saving customFields to Firebase:', JSON.stringify(app.customFields));
                console.log('📤 Saving defaultFields to Firebase');
                
                // Nettoyer les undefined pour Firebase (Firebase n'accepte pas undefined)
                const cleanDefaultFields = app.defaultFields.map(f => {
                    const clean = { ...f };
                    // Supprimer les propriétés undefined
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });
                    return clean;
                });
                
                const cleanCustomFields = app.customFields.map(f => {
                    const clean = { ...f };
                    // Supprimer les propriétés undefined
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });
                    return clean;
                });
                
                const userDoc = db.collection('users').doc(userId);
                batch.set(userDoc, {
                    customTags: app.customTags,
                    customFields: cleanCustomFields,
                    defaultFields: cleanDefaultFields
                }, { merge: true });

                await batch.commit();
                console.log('✅ All data saved to Firebase successfully');
                
                // Invalider le cache si on a sauvegardé des contacts
                if (specificContact || this.contacts.length > 0) {
                    localStorage.removeItem('contactsCache');
                    localStorage.removeItem('contactsLastLoad');
                    console.log('🗑️ Cache invalidated');
                }
            } catch (error) {
                console.error('❌ Error saving to Firebase:', error);
            }
        },

        async saveMetadata() {
            // NOUVELLE FONCTION: Sauvegarder SEULEMENT les métadonnées (tags, fields) sans toucher aux contacts
            // Économise énormément de lectures/écritures Firebase
            if (!authManager.currentUser) {
                console.warn('⚠️ No user logged in, cannot save to Firebase');
                return;
            }

            try {
                const userId = authManager.currentUser.uid;
                console.log('💾 SAVING METADATA ONLY to Firebase - User:', userId);
                
                // Nettoyer les undefined pour Firebase
                const cleanDefaultFields = app.defaultFields.map(f => {
                    const clean = { ...f };
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });
                    return clean;
                });
                
                const cleanCustomFields = app.customFields.map(f => {
                    const clean = { ...f };
                    Object.keys(clean).forEach(key => {
                        if (clean[key] === undefined) delete clean[key];
                    });
                    return clean;
                });
                
                const userDoc = db.collection('users').doc(userId);
                await userDoc.set({
                    customTags: app.customTags,
                    customFields: cleanCustomFields,
                    defaultFields: cleanDefaultFields
                }, { merge: true });

                console.log('✅ Metadata saved to Firebase (1 write instead of', this.contacts.length + 1, 'writes)');
            } catch (error) {
                console.error('❌ Error saving metadata to Firebase:', error);
            }
        },

        async deleteContact(contactId) {
            if (!authManager.currentUser) return;
            
            try {
                const userId = authManager.currentUser.uid;
                await db.collection('users').doc(userId).collection('contacts').doc(contactId).delete();
                console.log('✅ Contact deleted from Firebase');
                
                // Invalider le cache
                localStorage.removeItem('contactsCache');
                localStorage.removeItem('contactsLastLoad');
                console.log('🗑️ Cache invalidated');
            } catch (error) {
                console.error('❌ Error deleting contact:', error);
            }
        }
    },

    currentSection: 'contacts',

    async init() {
        // Attendre l'initialisation de Firebase
        if (!initFirebase()) {
            alert('Erreur de chargement de Firebase');
            return;
        }

        // Charger la préférence du mode sombre (localStorage, pas Firebase)
        this.loadDarkModePreference();

        // Vérifier l'authentification
        const isLoggedIn = await authManager.checkAuth();
        
        if (isLoggedIn) {
            // Restaurer la dernière section active
            const savedSection = localStorage.getItem('currentSection') || 'contacts';
            this.currentSection = savedSection;
            
            this.setupEventListeners();
            unfollowers.init();
            
            // Attendre un peu que les données Firebase soient chargées
            setTimeout(() => {
                console.log('📋 Rendering dynamic form with fields:', app.getAllFields().length);
                console.log('   - Default fields:', app.defaultFields.length);
                console.log('   - Custom fields:', app.customFields.length);
                
                // Générer le formulaire dynamiquement avec les champs personnalisés
                contacts.renderDynamicForm();
                
                // Générer les filtres dynamiquement
                contacts.renderFilters();
                
                // Générer les onglets de stats dynamiquement
                stats.renderTabs();
                
                contacts.render();
                stats.render();
                
                // Attendre un peu que le DOM soit mis à jour
                setTimeout(() => {
                    // switchSection va appeler adjustContactsLayout automatiquement
                    this.switchSection(savedSection);
                }, 100);
            }, 1000); // Augmenté à 1 seconde pour laisser le temps à Firebase
        }
    },

    setupEventListeners() {
        document.getElementById('searchBox').addEventListener('input', () => contacts.render());

        // Close filter dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('filterDropdown');
            const isFilterChip = e.target.closest('.filter-chip');
            if (!isFilterChip && dropdown && dropdown.style.display === 'block') {
                contacts.closeFilterDropdown();
            }
        });

        // Overlay click handling
        const overlay = document.getElementById('overlay');
        overlay.addEventListener('click', (e) => {
            // Check which modal is open
            const tagEditModal = document.getElementById('tagEditModal');
            const tagDropdown = document.getElementById('tagDropdown');
            
            // If tag edit modal is open, close only that
            if (tagEditModal && tagEditModal.classList.contains('active')) {
                tags.closeEditModal();
            }
            // Otherwise close tag dropdown
            else if (tagDropdown && tagDropdown.classList.contains('active')) {
                tags.closeDropdown();
            }
        });
        
        // Prevent clicks inside modals from propagating to overlay
        document.querySelectorAll('.modal, .tag-dropdown-container').forEach(modal => {
            modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    },

    // ==========================================
    // GESTION DES CHAMPS PERSONNALISÉS
    // ==========================================
    
    // Récupérer tous les champs (défaut + custom) triés par ordre
    getAllFields() {
        return [...this.defaultFields, ...this.customFields].sort((a, b) => a.order - b.order);
    },

    // Ajouter un nouveau champ personnalisé
    addCustomField(fieldData) {
        console.log('➕ addCustomField called with:', fieldData);
        const newField = {
            id: 'custom_' + Date.now(),
            type: fieldData.type,
            label: fieldData.label,
            required: false,
            order: this.getAllFields().length,
            placeholder: fieldData.placeholder || '',
            options: fieldData.options || [] // Pour select/radio
        };
        
        // Ajouter tags SEULEMENT pour les champs select (pas undefined pour Firebase)
        if (fieldData.type === 'select') {
            newField.tags = [];
        }
        
        console.log('➕ New field created:', newField);
        this.customFields.push(newField);
        console.log('➕ customFields after push:', this.customFields.length, this.customFields);
        this.dataStore.saveMetadata(); // Optimisé: sauvegarde seulement les métadonnées
        console.log('➕ saveMetadata() called');
        return newField;
    },

    // Supprimer un champ personnalisé
    deleteCustomField(fieldId) {
        const index = this.customFields.findIndex(f => f.id === fieldId);
        if (index === -1) return false;
        
        // Supprimer le champ
        this.customFields.splice(index, 1);
        
        // Supprimer les valeurs de ce champ dans tous les contacts
        this.dataStore.contacts.forEach(contact => {
            if (contact[fieldId]) {
                delete contact[fieldId];
            }
        });
        
        this.dataStore.saveMetadata(); // Optimisé: sauvegarde seulement les métadonnées
        return true;
    },

    // Réordonner les champs
    reorderFields(fieldId, newOrder) {
        const allFields = this.getAllFields();
        const field = allFields.find(f => f.id === fieldId);
        if (!field) return false;
        
        field.order = newOrder;
        
        // Réajuster les ordres des autres champs
        allFields.forEach((f, index) => {
            if (f.id !== fieldId) {
                f.order = index >= newOrder ? index + 1 : index;
            }
        });
        
        this.dataStore.saveMetadata(); // Optimisé: sauvegarde seulement les métadonnées
        return true;
    },

    // Migrer les anciens tags vers le nouveau système
    migrateToNewFieldSystem() {
        console.log('🔄 Migration vers le nouveau système de champs...');
        
        // Fonction helper pour fusionner les tags sans doublons
        const mergeTags = (defaults, customs) => {
            const tagMap = new Map();
            
            // D'abord ajouter les defaults
            defaults.forEach(tag => {
                tagMap.set(tag.value, tag);
            });
            
            // Ensuite ajouter/remplacer avec les customs (priorité aux customs)
            customs.forEach(tag => {
                tagMap.set(tag.value, tag);
            });
            
            return Array.from(tagMap.values());
        };
        
        // Pour les utilisateurs existants, copier leurs tags dans les champs
        const relationField = this.defaultFields.find(f => f.id === 'relationType');
        if (relationField && this.customTags.relationType) {
            relationField.tags = mergeTags(
                this.defaultTags.relationType || [], 
                this.customTags.relationType || []
            );
            console.log('✅ Migrated relationType tags:', relationField.tags.length);
        }
        
        const meetingField = this.defaultFields.find(f => f.id === 'meetingPlace');
        if (meetingField && this.customTags.meetingPlace) {
            meetingField.tags = mergeTags(
                this.defaultTags.meetingPlace || [], 
                this.customTags.meetingPlace || []
            );
            console.log('✅ Migrated meetingPlace tags:', meetingField.tags.length);
        }
        
        const statusField = this.defaultFields.find(f => f.id === 'discussionStatus');
        if (statusField && this.customTags.discussionStatus) {
            statusField.tags = mergeTags(
                this.defaultTags.discussionStatus || [], 
                this.customTags.discussionStatus || []
            );
            console.log('✅ Migrated discussionStatus tags:', statusField.tags.length);
        }
        
        console.log('✅ Migration terminée');
    },

    switchSection(section) {
        // Reset scroll to top - body et container
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        // Reset scroll de toutes les sections
        document.querySelectorAll('.section').forEach(s => {
            s.scrollTop = 0;
        });
        
        // Save current section
        this.currentSection = section;
        localStorage.setItem('currentSection', section);
        
        // Retirer active de toutes les sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        // Gérer l'affichage du header
        const header = document.querySelector('.header');
        const container = document.querySelector('.container');
        
        // Ordre des onglets : Contacts (0), Stats (1), Analyse (2), Unfollowers (3), Profil (4)
        if (section === 'contacts') {
            document.getElementById('contactsSection').classList.add('active');
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            header.style.display = 'block';
            container.style.marginTop = '230px'; // Remettre le margin-top pour le header
            
            contacts.render();
        } else if (section === 'stats') {
            document.getElementById('statsSection').classList.add('active');
            document.querySelectorAll('.nav-item')[1].classList.add('active');
            header.style.display = 'none';
            container.style.marginTop = '0';
            stats.render();
        } else if (section === 'analyse') {
            document.getElementById('analyseSection').classList.add('active');
            document.querySelectorAll('.nav-item')[2].classList.add('active');
            header.style.display = 'none';
            container.style.marginTop = '0';
        } else if (section === 'unfollowers') {
            document.getElementById('unfollowersSection').classList.add('active');
            document.querySelectorAll('.nav-item')[3].classList.add('active');
            header.style.display = 'none';
            container.style.marginTop = '0';
        } else if (section === 'profil') {
            document.getElementById('profilSection').classList.add('active');
            document.querySelectorAll('.nav-item')[4].classList.add('active');
            header.style.display = 'none';
            container.style.marginTop = '0';
            this.updateProfilSection();
        }
    },

    updateProfilSection() {
        // Mettre à jour les informations du profil
        const userEmailEl = document.getElementById('profilUserEmail');
        if (userEmailEl && authManager.currentUser) {
            userEmailEl.textContent = authManager.currentUser.email;
        }
        
        // Mettre à jour les statistiques
        document.getElementById('profilContactsCount').textContent = app.dataStore.contacts.length;
        document.getElementById('profilFollowersCount').textContent = unfollowers.data.followers.length;
        document.getElementById('profilUnfollowersCount').textContent = unfollowers.data.unfollowers.length;
        
        // Synchroniser le toggle du mode sombre
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
        }
    },

    openAddModal() {
        contacts.currentEditId = null;
        
        // Générer le formulaire dynamiquement avec les champs personnalisés
        contacts.renderDynamicForm();
        
        // Initialiser les champs city
        contacts.initCityFields();
        
        document.getElementById('contactForm').reset();
        
        // Reset tag selectors - TEXTE ET VALEURS
        ['relationType', 'meetingPlace', 'discussionStatus'].forEach(fieldId => {
            // Reset du texte affiché
            const displayEl = document.getElementById(fieldId + 'Display');
            if (displayEl) {
                displayEl.textContent = 'Sélectionner...';
                displayEl.className = 'tag-selector-placeholder';
            }
            // Reset de la valeur cachée
            const hiddenInput = document.getElementById(fieldId);
            if (hiddenInput) {
                hiddenInput.value = '';
            }
        });
        
        // Reset gender radio buttons
        document.getElementById('genderMale').checked = false;
        document.getElementById('genderFemale').checked = false;
        
        document.getElementById('modalTitle').textContent = '➕ Nouveau contact';
        
        // Reset scroll to top of modal
        const addModal = document.getElementById('addModal');
        addModal.classList.add('active');
        addModal.scrollTop = 0;
    },

    closeAddModal() {
        document.getElementById('addModal').classList.remove('active');
        contacts.currentEditId = null;
        
        // Reset scroll lors de la fermeture pour qu'il soit à 0 à la prochaine ouverture
        const modalContent = document.querySelector('#addModal .modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    },

    closeViewModal() {
        document.getElementById('viewModal').classList.remove('active');
        contacts.currentViewId = null;
    },

    // Dark Mode Management
    loadDarkModePreference() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
        // Update toggle state when visiting profile
        setTimeout(() => {
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) {
                toggle.checked = darkMode;
            }
        }, 100);
    },

    toggleDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        const isDarkMode = toggle.checked;
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'false');
        }
        
        console.log('🌙 Dark mode:', isDarkMode ? 'enabled' : 'disabled');
    }
};

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => app.init());
