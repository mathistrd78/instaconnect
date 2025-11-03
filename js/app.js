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
            const saved = localStorage.getItem('instaConnectContacts');
            if (saved) app.dataStore.contacts = JSON.parse(saved);
            
            const savedTags = localStorage.getItem('instaConnectCustomTags');
            if (savedTags) app.customTags = JSON.parse(savedTags);
        },
        
        save() {
            localStorage.setItem('instaConnectContacts', JSON.stringify(app.dataStore.contacts));
            localStorage.setItem('instaConnectCustomTags', JSON.stringify(app.customTags));
        }
    },

    currentSection: 'contacts',

    init() {
        this.dataStore.load();
        
        // Restore last active section
        const savedSection = localStorage.getItem('currentSection') || 'contacts';
        this.currentSection = savedSection;
        
        this.setupEventListeners();
        contacts.render();
        stats.render();
        unfollowers.init();
        
        // Switch to saved section
        this.switchSection(savedSection);
    },

    setupEventListeners() {
        document.getElementById('searchBox').addEventListener('input', () => contacts.render());
        document.getElementById('filterRelation').addEventListener('change', () => contacts.render());
        document.getElementById('filterLieu').addEventListener('change', () => contacts.render());
        document.getElementById('filterStatut').addEventListener('change', () => contacts.render());

        document.getElementById('overlay').addEventListener('click', () => {
            tags.closeDropdown();
            tags.closeEditModal();
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
