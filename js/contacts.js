// contacts.js - Gestion des contacts
const contacts = {
    currentViewId: null,
    currentEditId: null,
    currentFieldType: null,
    
    // État des filtres
    activeFilters: {
        gender: [],
        relationType: [],
        meetingPlace: [],
        discussionStatus: [],
        complete: [] // 'oui' ou 'non'
    },
    currentFilterDropdown: null,

    openTagSelector(fieldType) {
        this.currentFieldType = fieldType;
        tags.showDropdown(event, 'form', fieldType);
    },

    selectFormTag(value) {
        if (!this.currentFieldType) return;
        
        // Set hidden input value
        document.getElementById(this.currentFieldType).value = value;
        
        // Update display
        const tag = tags.findTag(this.currentFieldType, value);
        if (tag) {
            const displayEl = document.getElementById(this.currentFieldType + 'Display');
            displayEl.textContent = tag.label;
            displayEl.className = 'tag-selector-value';
        }
        
        tags.closeDropdown();
        this.currentFieldType = null;
    },

    render() {
        const filtered = this.getFiltered();
        const grid = document.getElementById('contactsGrid');
        const empty = document.getElementById('emptyState');
        
        // Update counter
        const countElement = document.getElementById('contactsCountNumber');
        if (countElement) {
            countElement.textContent = filtered.length;
        }

        if (filtered.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'block';
            this.updateAlphabetNav([]);
            return;
        }

        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        // Grouper les contacts par première lettre
        const groupedContacts = {};
        const letters = [];
        
        filtered.forEach(contact => {
            const firstLetter = contact.firstName.charAt(0).toUpperCase();
            if (!groupedContacts[firstLetter]) {
                groupedContacts[firstLetter] = [];
                letters.push(firstLetter);
            }
            groupedContacts[firstLetter].push(contact);
        });
        
        // Trier les lettres
        letters.sort();
        
        // Générer le HTML avec des séparateurs de lettres
        let html = '';
        letters.forEach(letter => {
            html += `<div class="letter-divider" data-letter="${letter}" id="letter-${letter}">${letter}</div>`;
            
            groupedContacts[letter].forEach(contact => {
                const relTag = tags.findTag('relationType', contact.relationType);
                const meetTag = tags.findTag('meetingPlace', contact.meetingPlace);
                const statTag = tags.findTag('discussionStatus', contact.discussionStatus);
                
                html += `
                <div class="contact-card">
                    <div class="contact-header">
                        <div class="contact-info">
                            <div class="contact-name">${contact.firstName}</div>
                            <div class="contact-instagram">${contact.instagram}</div>
                        </div>
                    </div>
                    <div class="contact-tags">
                        <span class="tag-mini ${relTag?.class || ''}" onclick="tags.showDropdown(event, '${contact.id}', 'relationType')">
                            ${relTag?.label || 'Type'}
                        </span>
                        <span class="tag-mini ${meetTag?.class || ''}" onclick="tags.showDropdown(event, '${contact.id}', 'meetingPlace')">
                            ${meetTag?.label || 'Lieu'}
                        </span>
                        <span class="tag-mini ${statTag?.class || ''}" onclick="tags.showDropdown(event, '${contact.id}', 'discussionStatus')">
                            ${statTag?.label || 'Statut'}
                        </span>
                    </div>
                    <div class="contact-actions">
                        <button class="btn-action btn-view" onclick="contacts.viewProfile('${contact.id}')">
                            👁️ Voir profil
                        </button>
                        <button class="btn-action btn-insta" onclick="contacts.openInstagramProfile('${contact.instagram}')">
                            📸 Instagram
                        </button>
                    </div>
                </div>
                `;
            });
        });
        
        grid.innerHTML = html;
        
        // Mettre à jour la navigation alphabétique
        this.updateAlphabetNav(letters);
    },

    // Mettre à jour la barre alphabétique pour montrer quelles lettres ont des contacts
    updateAlphabetNav(letters) {
        const alphabetNav = document.getElementById('alphabetNav');
        if (!alphabetNav) return;
        
        const allLetters = alphabetNav.querySelectorAll('.alphabet-letter');
        allLetters.forEach(letterEl => {
            const letter = letterEl.getAttribute('data-letter');
            if (letters.includes(letter)) {
                letterEl.classList.add('has-contacts');
            } else {
                letterEl.classList.remove('has-contacts');
            }
        });
    },

    // Scroller vers une lettre spécifique
    scrollToLetter(letter) {
        const letterElement = document.getElementById('letter-' + letter);
        if (letterElement) {
            // Scroll avec un offset pour le header
            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const elementPosition = letterElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 10;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            
            // Effet visuel temporaire
            letterElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                letterElement.style.transform = 'scale(1)';
            }, 300);
        }
    },

    getFiltered() {
        const search = document.getElementById('searchBox').value.toLowerCase();

        return app.dataStore.contacts.filter(c => {
            // Recherche : uniquement au début du nom (pas partout)
            const matchSearch = c.firstName.toLowerCase().startsWith(search) || c.instagram.toLowerCase().startsWith(search);
            
            // Filtres cumulables
            const matchGender = this.activeFilters.gender.length === 0 || this.activeFilters.gender.includes(c.gender);
            const matchRel = this.activeFilters.relationType.length === 0 || this.activeFilters.relationType.includes(c.relationType);
            const matchLieu = this.activeFilters.meetingPlace.length === 0 || this.activeFilters.meetingPlace.includes(c.meetingPlace);
            const matchStat = this.activeFilters.discussionStatus.length === 0 || this.activeFilters.discussionStatus.includes(c.discussionStatus);
            
            // Filtre profil complet : vérifier si tous les champs obligatoires sont remplis
            let matchComplete = true;
            if (this.activeFilters.complete.length > 0) {
                const isEmpty = (value) => !value || value === '';
                const isComplete = !isEmpty(c.relationType) && !isEmpty(c.meetingPlace) && !isEmpty(c.discussionStatus) && !isEmpty(c.gender);
                
                if (this.activeFilters.complete.includes('oui')) {
                    matchComplete = isComplete; // Profil complet
                } else if (this.activeFilters.complete.includes('non')) {
                    matchComplete = !isComplete; // Profil incomplet
                }
            }
            
            return matchSearch && matchGender && matchRel && matchLieu && matchStat && matchComplete;
        }).sort((a, b) => {
            // Tri alphabétique : ignorer les caractères spéciaux (@, _, etc.)
            const cleanA = a.firstName.replace(/^[@_\-\.\s]+/, '').toLowerCase();
            const cleanB = b.firstName.replace(/^[@_\-\.\s]+/, '').toLowerCase();
            return cleanA.localeCompare(cleanB, 'fr');
        });
    },

    saveContact(e) {
        e.preventDefault();
        
        console.log('🔵 START saveContact - currentEditId:', this.currentEditId);
        
        let instagram = document.getElementById('instagram').value.toLowerCase().trim();
        if (!instagram.startsWith('@')) instagram = '@' + instagram;
        
        // Remove @ for checking
        const cleanUsername = instagram.replace('@', '');
        
        // Check if in "do not follow" list
        if (unfollowers.data.doNotFollowList.has(cleanUsername) && !this.currentEditId) {
            const proceed = confirm(
                `⚠️ ATTENTION !\n\n` +
                `@${cleanUsername} est dans votre liste "À ne plus suivre".\n\n` +
                `Vous avez marqué ce profil comme quelqu'un à ne plus suivre.\n\n` +
                `Voulez-vous quand même l'ajouter à vos contacts ?`
            );
            
            if (!proceed) {
                return; // Cancel adding
            }
        }
        
        // Get gender
        let gender = '';
        if (document.getElementById('genderMale').checked) {
            gender = 'Homme';
        } else if (document.getElementById('genderFemale').checked) {
            gender = 'Femme';
        }
        
        console.log('🔵 Gender selected:', gender);
        
        const contact = {
            id: this.currentEditId || Date.now().toString(),
            firstName: document.getElementById('firstName').value,
            instagram,
            relationType: document.getElementById('relationType').value,
            meetingPlace: document.getElementById('meetingPlace').value,
            discussionStatus: document.getElementById('discussionStatus').value,
            gender: gender,
            profession: document.getElementById('profession').value,
            location: document.getElementById('location').value,
            age: document.getElementById('age').value,
            phone: document.getElementById('phone').value,
            interests: document.getElementById('interests').value,
            notes: document.getElementById('notes').value,
            dateAdded: this.currentEditId ? 
                app.dataStore.contacts.find(c => c.id === this.currentEditId)?.dateAdded || new Date().toISOString() : 
                new Date().toISOString()
        };

        console.log('🔵 Contact object created:', JSON.stringify(contact, null, 2));

        if (this.currentEditId) {
            const idx = app.dataStore.contacts.findIndex(c => c.id === this.currentEditId);
            console.log('🔵 Editing existing contact at index:', idx);
            if (idx !== -1) {
                app.dataStore.contacts[idx] = contact;
                console.log('🔵 Contact updated in local array');
            } else {
                console.error('❌ Contact not found in local array!');
            }
        } else {
            app.dataStore.contacts.push(contact);
            console.log('🔵 New contact added to local array');
        }

        console.log('🔵 Calling save with contact:', contact.id);
        app.dataStore.save(contact); // Passer le contact spécifique
        this.render();
        app.closeAddModal();
        if (this.currentViewId) this.viewProfile(this.currentViewId);
        
        console.log('🔵 END saveContact');
    },

    openInstagramProfile(username) {
        const clean = username.replace('@', '');
        const instagramUrl = `https://instagram.com/${clean}`;
        const instagramApp = `instagram://user?username=${clean}`;
        
        // Détecter le mode PWA
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        if (isPWA) {
            // PWA: Ouvrir directement dans un nouvel onglet (pas de page blanche)
            window.open(instagramUrl, '_blank', 'noopener,noreferrer');
        } else {
            // Navigateur: Essayer d'ouvrir l'app Instagram d'abord
            window.location.href = instagramApp;
            setTimeout(() => window.open(instagramUrl, '_blank'), 500);
        }
    },

    viewProfile(id) {
        const contact = app.dataStore.contacts.find(c => c.id === id);
        if (!contact) return;

        this.currentViewId = id;
        
        document.getElementById('profileName').textContent = contact.firstName;
        document.getElementById('profileInsta').textContent = contact.instagram;
        
        const fields = [
            {key: 'relationType', label: 'Type de relation'},
            {key: 'meetingPlace', label: 'Lieu de rencontre'},
            {key: 'discussionStatus', label: 'Statut de discussion'},
            {key: 'gender', label: 'Sexe'},
            {key: 'profession', label: 'Études / Profession'},
            {key: 'location', label: 'Lieu d\'habitation'},
            {key: 'age', label: 'Âge', suffix: ' ans'},
            {key: 'phone', label: 'Téléphone', link: true},
            {key: 'interests', label: 'Centres d\'intérêt'},
            {key: 'notes', label: 'Notes'}
        ];

        let html = fields.filter(f => contact[f.key]).map(f => {
            let value = contact[f.key];
            if (f.suffix) value += f.suffix;
            if (f.link) value = `<a href="tel:${value}" style="color: #E1306C;">${value}</a>`;
            return `
                <div class="profile-info-item">
                    <strong>${f.label}</strong>
                    <span>${value}</span>
                </div>
            `;
        }).join('');

        html += `
            <div class="profile-info-item">
                <strong>Ajouté le</strong>
                <span>${new Date(contact.dateAdded).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
            </div>
        `;

        document.getElementById('profileInfo').innerHTML = html;
        document.getElementById('viewModal').classList.add('active');
        document.querySelector('#viewModal .modal-content').scrollTop = 0;
    },

    openInstagram() {
        const contact = app.dataStore.contacts.find(c => c.id === this.currentViewId);
        if (contact) this.openInstagramProfile(contact.instagram);
    },

    editProfile() {
        const contact = app.dataStore.contacts.find(c => c.id === this.currentViewId);
        if (!contact) return;

        this.currentEditId = this.currentViewId;
        
        document.getElementById('firstName').value = contact.firstName;
        document.getElementById('instagram').value = contact.instagram.replace('@', '');
        
        // Set tag selectors
        const fields = [
            {id: 'relationType', value: contact.relationType},
            {id: 'meetingPlace', value: contact.meetingPlace},
            {id: 'discussionStatus', value: contact.discussionStatus}
        ];
        
        fields.forEach(field => {
            document.getElementById(field.id).value = field.value;
            const tag = tags.findTag(field.id, field.value);
            if (tag) {
                const displayEl = document.getElementById(field.id + 'Display');
                displayEl.textContent = tag.label;
                displayEl.className = 'tag-selector-value';
            }
        });
        
        document.getElementById('profession').value = contact.profession || '';
        document.getElementById('location').value = contact.location || '';
        document.getElementById('age').value = contact.age || '';
        document.getElementById('phone').value = contact.phone || '';
        document.getElementById('interests').value = contact.interests || '';
        document.getElementById('notes').value = contact.notes || '';
        
        // Set gender radio buttons
        if (contact.gender === 'Homme') {
            document.getElementById('genderMale').checked = true;
        } else if (contact.gender === 'Femme') {
            document.getElementById('genderFemale').checked = true;
        } else {
            // Uncheck both if no gender set
            document.getElementById('genderMale').checked = false;
            document.getElementById('genderFemale').checked = false;
        }
        
        document.getElementById('modalTitle').textContent = '✏️ Modifier le contact';
        app.closeViewModal();
        document.getElementById('addModal').classList.add('active');
    },

    deleteContact() {
        if (!confirm('Supprimer ce contact ?')) return;
        
        // Delete from Firebase
        app.dataStore.deleteContact(this.currentViewId);
        
        // Remove from local array (will be synced by Firebase listener)
        app.dataStore.contacts = app.dataStore.contacts.filter(c => c.id !== this.currentViewId);
        
        this.render();
        stats.render();
        app.closeViewModal();
    },
    
    deleteAndUnfollow() {
        const contact = app.dataStore.contacts.find(c => c.id === this.currentViewId);
        if (!contact) return;
        
        const cleanUsername = contact.instagram.replace('@', '');
        
        if (!confirm(
            `⚠️ ATTENTION !\n\n` +
            `Vous allez :\n` +
            `1️⃣ Supprimer la fiche contact de ${contact.firstName}\n` +
            `2️⃣ Ajouter @${cleanUsername} à la liste "À ne plus suivre"\n\n` +
            `Cette personne ne réapparaîtra plus dans les analyses.\n\n` +
            `Confirmer ?`
        )) return;
        
        // Add to doNotFollowList
        unfollowers.data.doNotFollowList.add(cleanUsername);
        unfollowers.saveDoNotFollowList();
        
        // Delete from Firebase
        app.dataStore.deleteContact(this.currentViewId);
        
        // Remove from local array
        app.dataStore.contacts = app.dataStore.contacts.filter(c => c.id !== this.currentViewId);
        
        this.render();
        stats.render();
        app.closeViewModal();
        
        // Show confirmation
        alert(`✅ Fiche supprimée et @${cleanUsername} ajouté à la liste "À ne plus suivre"`);
    },
    
    // Gestion des filtres
    toggleFilterDropdown(filterType, event) {
        event.stopPropagation();
        
        const dropdown = document.getElementById('filterDropdown');
        const btn = event.currentTarget;
        
        // Si on clique sur le même filtre, on ferme
        if (this.currentFilterDropdown === filterType && dropdown.style.display === 'block') {
            this.closeFilterDropdown();
            return;
        }
        
        this.currentFilterDropdown = filterType;
        
        // Générer les options
        let options = [];
        if (filterType === 'gender') {
            options = [
                { value: 'Homme', label: '👨 Homme' },
                { value: 'Femme', label: '👩 Femme' }
            ];
        } else if (filterType === 'complete') {
            options = [
                { value: 'oui', label: '✅ Oui' },
                { value: 'non', label: '❌ Non' }
            ];
        } else {
            // Combiner les tags par défaut et personnalisés en évitant les doublons
            const defaultTags = app.defaultTags[filterType] || [];
            const customTags = app.customTags[filterType] || [];
            
            // Créer un Map pour éviter les doublons (clé = value)
            const tagMap = new Map();
            
            // Ajouter d'abord les tags par défaut
            defaultTags.forEach(tag => {
                tagMap.set(tag.value, tag);
            });
            
            // Ajouter les tags personnalisés (écrase les doublons avec la version personnalisée)
            customTags.forEach(tag => {
                tagMap.set(tag.value, tag);
            });
            
            // Convertir en tableau
            options = Array.from(tagMap.values());
        }
        
        // Construire le HTML
        const html = options.map((opt, index) => {
            const isSelected = this.activeFilters[filterType].includes(opt.value);
            return `
                <div class="filter-option ${isSelected ? 'selected' : ''}" data-filter-type="${filterType}" data-option-index="${index}">
                    <div class="filter-option-checkbox"></div>
                    <span>${opt.label}</span>
                </div>
            `;
        }).join('');
        
        document.getElementById('filterDropdownContent').innerHTML = html;
        
        // Ajouter les event listeners
        document.querySelectorAll('.filter-option').forEach((el, index) => {
            el.addEventListener('click', () => {
                const value = options[index].value;
                this.toggleFilterValue(filterType, value);
            });
        });
        
        dropdown.style.display = 'block';
        
        // Ne pas activer visuellement le bouton, juste ouvrir le dropdown
        // L'état actif dépend uniquement des filtres sélectionnés
    },
    
    toggleFilterValue(filterType, value) {
        const index = this.activeFilters[filterType].indexOf(value);
        if (index > -1) {
            this.activeFilters[filterType].splice(index, 1);
        } else {
            this.activeFilters[filterType].push(value);
        }
        
        // Update button appearance
        this.updateFilterButtons();
        
        // Re-render with new filters
        this.render();
        
        // Rebuild dropdown to show updated selections
        const btn = document.querySelector(`#filter${filterType === 'gender' ? 'Gender' : filterType === 'relationType' ? 'Relation' : filterType === 'meetingPlace' ? 'Lieu' : 'Statut'}Btn`);
        if (btn) {
            this.toggleFilterDropdown(filterType, { currentTarget: btn, stopPropagation: () => {} });
        }
    },
    
    updateFilterButtons() {
        // Update each filter button
        const hasGenderFilter = this.activeFilters.gender.length > 0;
        const hasRelFilter = this.activeFilters.relationType.length > 0;
        const hasLieuFilter = this.activeFilters.meetingPlace.length > 0;
        const hasStatutFilter = this.activeFilters.discussionStatus.length > 0;
        const hasCompleteFilter = this.activeFilters.complete.length > 0;
        
        document.getElementById('filterGenderBtn').classList.toggle('active', hasGenderFilter);
        document.getElementById('filterRelationBtn').classList.toggle('active', hasRelFilter);
        document.getElementById('filterLieuBtn').classList.toggle('active', hasLieuFilter);
        document.getElementById('filterStatutBtn').classList.toggle('active', hasStatutFilter);
        document.getElementById('filterCompleteBtn').classList.toggle('active', hasCompleteFilter);
        
        // Show/hide reset button
        const hasAnyFilter = hasGenderFilter || hasRelFilter || hasLieuFilter || hasStatutFilter || hasCompleteFilter;
        document.getElementById('filterResetBtn').style.display = hasAnyFilter ? 'flex' : 'none';
    },
    
    resetFilters() {
        this.activeFilters = {
            gender: [],
            relationType: [],
            meetingPlace: [],
            discussionStatus: [],
            complete: []
        };
        
        this.updateFilterButtons();
        this.closeFilterDropdown();
        this.render();
    },
    
    closeFilterDropdown() {
        document.getElementById('filterDropdown').style.display = 'none';
        this.currentFilterDropdown = null;
        
        // Update visual state based on actual filters, not dropdown state
        this.updateFilterButtons();
    }
};
