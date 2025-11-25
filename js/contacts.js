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

    // Générer dynamiquement les filtres en fonction des champs
    renderFilters() {
        console.log('🎯 renderFilters called');
        const filtersContainer = document.querySelector('.filters-horizontal');
        if (!filtersContainer) {
            console.error('❌ filters-horizontal container not found!');
            return;
        }
        
        // Récupérer tous les champs filtrables (select, radio, checkbox)
        const allFields = app.getAllFields();
        console.log('📋 All fields:', allFields.length);
        const filterableFields = allFields.filter(field => 
            field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
        );
        console.log('🔍 Filterable fields:', filterableFields.length, filterableFields.map(f => f.label));
        
        // Ajouter "Profil complet" comme filtre spécial
        const specialFilters = [
            { id: 'complete', label: 'Profil complet' }
        ];
        
        // Générer les boutons de filtres
        const filtersHTML = filterableFields.map(field => `
            <button class="filter-chip" id="filter_${field.id}_Btn" data-filter-type="${field.id}">
                <span>${field.label}</span>
                <span class="filter-arrow">▼</span>
            </button>
        `).join('');
        
        const specialFiltersHTML = specialFilters.map(filter => `
            <button class="filter-chip" id="filter_${filter.id}_Btn" data-filter-type="${filter.id}">
                <span>${filter.label}</span>
                <span class="filter-arrow">▼</span>
            </button>
        `).join('');
        
        const resetButton = `
            <button class="filter-chip filter-reset" id="filterResetBtn" style="display: none;">
                <span>✕ Réinitialiser</span>
            </button>
        `;
        
        filtersContainer.innerHTML = filtersHTML + specialFiltersHTML + resetButton;
        
        // Ajouter les event listeners APRÈS avoir créé les boutons
        filterableFields.forEach(field => {
            const btn = document.getElementById(`filter_${field.id}_Btn`);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    console.log('🔘 Filter clicked:', field.id);
                    this.toggleFilterDropdown(field.id, e);
                });
            }
        });
        
        specialFilters.forEach(filter => {
            const btn = document.getElementById(`filter_${filter.id}_Btn`);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    console.log('🔘 Special filter clicked:', filter.id);
                    this.toggleFilterDropdown(filter.id, e);
                });
            }
        });
        
        const resetBtn = document.getElementById('filterResetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log('🔄 Reset filters clicked');
                this.resetFilters();
            });
        }
        
        // Initialiser activeFilters pour tous les champs
        filterableFields.forEach(field => {
            if (!this.activeFilters[field.id]) {
                this.activeFilters[field.id] = [];
            }
        });
        
        console.log('✅ renderFilters completed');
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
            return;
        }

        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        // Grouper les contacts par première lettre (en ignorant les @)
        const groupedContacts = {};
        const letters = [];
        
        filtered.forEach(contact => {
            // Enlever les @ au début du prénom si présents
            let name = contact.firstName;
            while (name.charAt(0) === '@') {
                name = name.substring(1);
            }
            
            const firstLetter = name.charAt(0).toUpperCase();
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
                            <a href="https://instagram.com/${contact.instagram.replace('@', '')}" target="_blank" rel="noopener noreferrer" class="contact-instagram">${contact.instagram}</a>
                        </div>
                        <button class="btn-view-eye" onclick="contacts.viewProfile('${contact.id}')" title="Voir le profil">
                            👁️
                        </button>
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
                </div>
                `;
            });
        });
        
        grid.innerHTML = html;
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
        
        // Base contact object
        const contact = {
            id: this.currentEditId || Date.now().toString(),
            firstName: document.getElementById('firstName').value,
            instagram,
            dateAdded: this.currentEditId ? 
                app.dataStore.contacts.find(c => c.id === this.currentEditId)?.dateAdded || new Date().toISOString() : 
                new Date().toISOString()
        };
        
        // Récupérer dynamiquement les valeurs de tous les champs
        const allFields = app.getAllFields();
        console.log('📋 All fields being saved:', allFields.length, allFields.map(f => `${f.id} (${f.type})`));
        allFields.forEach(field => {
            // Pour les radios, pas besoin de chercher un élément par ID
            if (field.type === 'radio') {
                const radioChecked = document.querySelector(`input[name="${field.id}"]:checked`);
                contact[field.id] = radioChecked ? radioChecked.value : '';
                console.log(`📻 Radio field ${field.id}:`, contact[field.id], '(checked element:', radioChecked, ')');
                return;
            }
            
            // Pour les autres types, chercher l'élément
            const element = document.getElementById(field.id);
            
            if (!element) {
                console.warn(`⚠️ Element not found for field: ${field.id}`);
                return;
            }
            
            switch (field.type) {
                case 'checkbox':
                    contact[field.id] = element.checked;
                    break;
                    
                case 'select':
                    // Pour les selects avec tags, prendre la valeur du hidden input
                    contact[field.id] = element.value || '';
                    break;
                    
                default:
                    // text, textarea, number, date, tel, email, url
                    contact[field.id] = element.value || '';
            }
        });

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
        if (contact) {
            const clean = contact.instagram.replace('@', '');
            window.location.href = `https://instagram.com/${clean}`;
        }
    },

    editProfile() {
        const contact = app.dataStore.contacts.find(c => c.id === this.currentViewId);
        if (!contact) return;

        this.currentEditId = this.currentViewId;
        
        // Re-générer le formulaire pour s'assurer qu'il est à jour
        this.renderDynamicForm();
        
        // Remplir les champs fixes
        document.getElementById('firstName').value = contact.firstName;
        document.getElementById('instagram').value = contact.instagram.replace('@', '');
        
        // Remplir dynamiquement tous les champs
        const allFields = app.getAllFields();
        allFields.forEach(field => {
            const value = contact[field.id];
            
            // Traiter les radios EN PREMIER (pas d'élément avec id="field.id")
            if (field.type === 'radio') {
                console.log(`📻 Loading radio field ${field.id}, value from contact:`, value);
                if (value) {
                    const radio = document.querySelector(`input[name="${field.id}"][value="${value}"]`);
                    console.log(`📻 Found radio element for "${value}":`, radio);
                    if (radio) {
                        radio.checked = true;
                        console.log(`📻 Radio checked:`, radio.checked);
                    } else {
                        console.error(`❌ Radio not found for name="${field.id}" value="${value}"`);
                    }
                }
                return; // Pas besoin de chercher d'élément par ID
            }
            
            // Pour les autres types, chercher l'élément par ID
            const element = document.getElementById(field.id);
            if (!element) return;
            
            switch (field.type) {
                case 'select':
                    // Champs avec tags
                    const displayEl = document.getElementById(field.id + 'Display');
                    const hiddenInput = document.getElementById(field.id);
                    
                    if (value) {
                        hiddenInput.value = value;
                        const tag = tags.findTag(field.id, value);
                        if (tag) {
                            displayEl.textContent = tag.label;
                            displayEl.className = 'tag-selector-value';
                        } else {
                            displayEl.textContent = 'Sélectionner...';
                            displayEl.className = 'tag-selector-placeholder';
                        }
                    } else {
                        hiddenInput.value = '';
                        displayEl.textContent = 'Sélectionner...';
                        displayEl.className = 'tag-selector-placeholder';
                    }
                    break;
                    
                case 'checkbox':
                    element.checked = !!value;
                    break;
                    
                default:
                    // text, textarea, number, date, tel, email, url
                    element.value = value || '';
            }
        });
        
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
        
        if (filterType === 'complete') {
            // Filtre spécial "Profil complet"
            options = [
                { value: 'oui', label: '✅ Oui' },
                { value: 'non', label: '❌ Non' }
            ];
        } else {
            // Trouver le champ correspondant
            const allFields = [...app.defaultFields, ...app.customFields];
            const field = allFields.find(f => f.id === filterType);
            
            if (!field) {
                console.error('Field not found:', filterType);
                return;
            }
            
            if (field.type === 'select') {
                // Champs select : utiliser tags (objet global)
                const fieldTags = tags.getAllOptions(filterType);
                options = fieldTags.map(tag => ({
                    value: tag.value,
                    label: tag.label
                }));
            } else if (field.type === 'radio') {
                // Champs radio : utiliser options
                options = (field.options || []).map(opt => ({
                    value: opt,
                    label: opt
                }));
            } else if (field.type === 'checkbox') {
                // Champs checkbox : Oui/Non
                options = [
                    { value: true, label: '✅ Oui' },
                    { value: false, label: '❌ Non' }
                ];
            }
        }
        
        // Construire le HTML
        const html = options.map((opt, index) => {
            const isSelected = this.activeFilters[filterType] && this.activeFilters[filterType].includes(opt.value);
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
    },

    // ==========================================
    // RENDU DYNAMIQUE DU FORMULAIRE
    // ==========================================

    renderDynamicForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        // Garder les champs fixes (Prénom et Instagram)
        const fixedFieldsHTML = `
            <div class="form-group">
                <label>Prénom <span style="color: #ff4757;">*</span></label>
                <input type="text" id="firstName" required>
            </div>
            <div class="form-group">
                <label>Pseudo Instagram <span style="color: #ff4757;">*</span></label>
                <div style="position: relative;">
                    <span style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #868e96; font-weight: 600;">@</span>
                    <input type="text" id="instagram" required style="padding-left: 36px;" oninput="this.value = this.value.toLowerCase().replace('@', '')">
                </div>
            </div>
        `;

        // Générer les champs dynamiques
        const allFields = app.getAllFields();
        const dynamicFieldsHTML = allFields.map(field => this.renderField(field)).join('');

        // Boutons d'action
        const actionsHTML = `
            <div class="form-group" style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 20px;">
                <button type="button" class="btn" style="background: #6c5ce7; color: white; width: 100%;" onclick="window.fields.openAddFieldModal()">
                    ➕ Ajouter un champ personnalisé
                </button>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">💾 Enregistrer</button>
            </div>
        `;

        form.innerHTML = fixedFieldsHTML + dynamicFieldsHTML + actionsHTML;
    },

    renderField(field) {
        const requiredMark = field.required ? '<span style="color: #ff4757;">*</span>' : '';
        const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : '';
        
        switch (field.type) {
            case 'select':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <div class="tag-selector" onclick="contacts.openTagSelector('${field.id}')">
                            <span id="${field.id}Display" class="tag-selector-placeholder">Sélectionner...</span>
                            <span class="tag-selector-arrow">▼</span>
                        </div>
                        <input type="hidden" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'radio':
                const options = field.options || [];
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <div style="display: flex; gap: 20px; margin-top: 8px; flex-wrap: wrap;">
                            ${options.map((opt, index) => `
                                <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                    <input type="radio" name="${field.id}" id="${field.id}_${index}" value="${opt}" style="width: 18px; height: 18px; cursor: pointer;" ${field.required ? 'required' : ''}>
                                    <span>${opt}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            
            case 'checkbox':
                return `
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="${field.id}" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>${field.label}</span>
                        </label>
                    </div>
                `;
            
            case 'textarea':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <textarea id="${field.id}" ${placeholder} ${field.required ? 'required' : ''}></textarea>
                    </div>
                `;
            
            case 'number':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="number" id="${field.id}" ${placeholder} ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'date':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="date" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'tel':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="tel" id="${field.id}" ${placeholder} ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'email':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="email" id="${field.id}" ${placeholder} ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'url':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="url" id="${field.id}" ${placeholder} ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'text':
            default:
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="text" id="${field.id}" ${placeholder} ${field.required ? 'required' : ''}>
                    </div>
                `;
        }
    }
};
