// app.js - Coordinateur principal
const app = {
    // Configuration des tags par défaut
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
        
        async save() {
            // Sauvegarder dans Firebase au lieu de localStorage
            if (!authManager.currentUser) {
                console.warn('⚠️ No user logged in, cannot save to Firebase');
                return;
            }

            try {
                const userId = authManager.currentUser.uid;
                const batch = db.batch();

                // Sauvegarder tous les contacts
                const contactsRef = db.collection('users').doc(userId).collection('contacts');
                this.contacts.forEach(contact => {
                    batch.set(contactsRef.doc(contact.id), contact);
                });

                // Sauvegarder les tags personnalisés
                const userDoc = db.collection('users').doc(userId);
                batch.set(userDoc, {
                    customTags: app.customTags
                }, { merge: true });

                await batch.commit();
                console.log('✅ Data saved to Firebase');
            } catch (error) {
                console.error('❌ Error saving to Firebase:', error);
            }
        },

        async deleteContact(contactId) {
            if (!authManager.currentUser) return;
            
            try {
                const userId = authManager.currentUser.uid;
                await db.collection('users').doc(userId).collection('contacts').doc(contactId).delete();
                console.log('✅ Contact deleted from Firebase');
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
                contacts.render();
                stats.render();
                this.switchSection(savedSection);
            }, 500);
        }
    },

    setupEventListeners() {
        document.getElementById('searchBox').addEventListener('input', () => contacts.render());
        document.getElementById('filterRelation').addEventListener('change', () => contacts.render());
        document.getElementById('filterLieu').addEventListener('change', () => contacts.render());
        document.getElementById('filterStatut').addEventListener('change', () => contacts.render());

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

    switchSection(section) {
        // Save current section
        this.currentSection = section;
        localStorage.setItem('currentSection', section);
        
        // Retirer active de toutes les sections
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        // Gérer l'affichage du header
        const header = document.querySelector('.header');
        
        // Activer la nouvelle section
        if (section === 'contacts') {
            document.getElementById('contactsSection').classList.add('active');
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            header.style.display = 'block';
            contacts.render();
        } else if (section === 'stats') {
            document.getElementById('statsSection').classList.add('active');
            document.querySelectorAll('.nav-item')[2].classList.add('active');
            header.style.display = 'none';
            stats.render();
        } else if (section === 'unfollowers') {
            document.getElementById('unfollowersSection').classList.add('active');
            document.querySelectorAll('.nav-item')[3].classList.add('active');
            header.style.display = 'none';
        }
    },

    toggleFilters() {
        const panel = document.getElementById('filtersPanel');
        const icon = document.getElementById('filterIcon');
        panel.classList.toggle('active');
        icon.textContent = panel.classList.contains('active') ? '▲' : '▼';
    },

    openAddModal() {
        contacts.currentEditId = null;
        document.getElementById('contactForm').reset();
        
        // Reset tag selectors
        ['relationType', 'meetingPlace', 'discussionStatus'].forEach(fieldId => {
            const displayEl = document.getElementById(fieldId + 'Display');
            if (displayEl) {
                displayEl.textContent = 'Sélectionner...';
                displayEl.className = 'tag-selector-placeholder';
            }
        });
        
        document.getElementById('modalTitle').textContent = '➕ Nouveau contact';
        document.getElementById('addModal').classList.add('active');
        document.querySelector('#addModal .modal-content').scrollTop = 0;
    },

    closeAddModal() {
        document.getElementById('addModal').classList.remove('active');
        contacts.currentEditId = null;
    },

    closeViewModal() {
        document.getElementById('viewModal').classList.remove('active');
        contacts.currentViewId = null;
    }
};

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => app.init());
