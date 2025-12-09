// contacts.js - Gestion des contacts

// Helper pour accéder à tags de manière sûre
const getTags = () => {
    if (typeof window.tags === 'undefined') {
        // Créer un objet tags minimal en fallback
        if (!window._tagsWarningShown) {
            console.warn('⚠️ tags module not loaded yet - using fallback');
            window._tagsWarningShown = true;
        }
        
        // Retourner un objet avec des fonctions stub
        return {
            findTag: (fieldType, value) => {
                // Essayer de trouver le tag directement dans app.defaultFields
                const allFields = [...(app.defaultFields || []), ...(app.customFields || [])];
                const field = allFields.find(f => f.id === fieldType);
                if (field && field.tags) {
                    return field.tags.find(t => t.value === value);
                }
                // Essayer dans customTags (ancienne structure)
                if (app.customTags && app.customTags[fieldType]) {
                    return app.customTags[fieldType].find(t => t.value === value);
                }
                return null;
            },
            closeDropdown: () => {
                // Stub
            }
        };
    }
    return window.tags;
};

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
        complete: [], // 'oui' ou 'non'
        country: [] // pays
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
        const tagsModule = getTags();
        const tag = tagsModule.findTag(this.currentFieldType, value);
        if (tag) {
            const displayEl = document.getElementById(this.currentFieldType + 'Display');
            displayEl.textContent = tag.label;
            displayEl.className = 'tag-selector-value';
        }
        
        tagsModule.closeDropdown();
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
        
        // Ajouter "Profil complet" et "Pays" comme filtres spéciaux
        const specialFilters = [
            { id: 'complete', label: 'Profil complet' },
            { id: 'country', label: 'Pays' }
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
        
        // Ajouter le listener pour la barre de recherche
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('input', () => {
                console.log('🔍 Search input changed:', searchBox.value);
                this.render();
            });
        }
        
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
        
        // Grouper les contacts par première lettre (en ignorant les caractères spéciaux)
        const groupedContacts = {};
        const letters = [];
        
        filtered.forEach(contact => {
            // Fonction pour extraire la première lettre alphabétique
            const getFirstLetter = (name) => {
                // Chercher le premier caractère alphabétique
                for (let i = 0; i < name.length; i++) {
                    const char = name[i];
                    if (/[a-zA-ZÀ-ÿ]/.test(char)) {
                        return char.toUpperCase();
                    }
                }
                return '#'; // Si aucune lettre alphabétique trouvée
            };
            
            const letter = getFirstLetter(contact.firstName || '');
            
            if (!groupedContacts[letter]) {
                groupedContacts[letter] = [];
                letters.push(letter);
            }
            groupedContacts[letter].push(contact);
        });
        
        // Trier les lettres alphabétiquement (# à la fin)
        letters.sort((a, b) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        });
        
        let html = '';
        letters.forEach(letter => {
            html += `<div class="letter-divider" id="letter-${letter}">${letter}</div>`;
            groupedContacts[letter].forEach(contact => {
                const tag = getTags().findTag('relationType', contact.relationType);
                const tagClass = tag ? tag.class : 'tag-default';
                
                const profilePic = contact.profilePicUrl ? 
                    `<img src="${contact.profilePicUrl}" alt="${contact.firstName}">` :
                    `<div class="contact-initial">${(contact.firstName || '?').charAt(0).toUpperCase()}</div>`;
                
                html += `
                    <div class="contact-card" onclick="contacts.viewProfile('${contact.id}')">
                        <div class="contact-header">
                            <div class="contact-avatar">${profilePic}</div>
                            <div class="contact-info">
                                <div class="contact-name">${contact.firstName || 'Sans nom'}</div>
                                <div class="contact-instagram">@${contact.instagram || ''}</div>
                            </div>
                        </div>
                        ${tag ? `<div class="contact-tag ${tagClass}">${tag.label}</div>` : ''}
                    </div>
                `;
            });
        });
        
        grid.innerHTML = html;
    },

    getFiltered() {
        let contacts = app.dataStore.contacts || [];
        
        // Filtre de recherche
        const searchQuery = document.getElementById('searchBox')?.value.toLowerCase() || '';
        if (searchQuery) {
            contacts = contacts.filter(contact => {
                const firstName = (contact.firstName || '').toLowerCase();
                const instagram = (contact.instagram || '').toLowerCase();
                const fullName = (contact.fullName || '').toLowerCase();
                return firstName.includes(searchQuery) || 
                       instagram.includes(searchQuery) || 
                       fullName.includes(searchQuery);
            });
        }
        
        // Appliquer les filtres actifs
        Object.keys(this.activeFilters).forEach(filterType => {
            const values = this.activeFilters[filterType];
            if (values && values.length > 0) {
                if (filterType === 'complete') {
                    // Filtre spécial "Profil complet"
                    contacts = contacts.filter(contact => {
                        const isComplete = this.isProfileComplete(contact);
                        if (values.includes('oui')) {
                            return isComplete;
                        }
                        if (values.includes('non')) {
                            return !isComplete;
                        }
                        return true;
                    });
                } else if (filterType === 'country') {
                    // Filtre spécial "Pays"
                    contacts = contacts.filter(contact => {
                        // Extraire le pays depuis cityField
                        let contactCountry = 'Non défini';
                        const allFields = app.getAllFields();
                        const cityFields = allFields.filter(f => f.type === 'city');
                        
                        if (cityFields.length > 0 && contact[cityFields[0].id]) {
                            try {
                                const cityData = JSON.parse(contact[cityFields[0].id]);
                                contactCountry = cityData.country || 'Non défini';
                            } catch (e) {
                                // Si ce n'est pas du JSON, c'est peut-être juste le texte
                                const parts = contact[cityFields[0].id].split(',');
                                if (parts.length > 1) {
                                    contactCountry = parts[parts.length - 1].trim();
                                }
                            }
                        }
                        
                        return values.includes(contactCountry);
                    });
                } else {
                    // Filtres normaux
                    contacts = contacts.filter(contact => {
                        const contactValue = contact[filterType];
                        return values.includes(contactValue);
                    });
                }
            }
        });
        
        // Tri par ordre alphabétique
        return contacts.sort((a, b) => {
            const nameA = (a.firstName || '').toLowerCase();
            const nameB = (b.firstName || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    },

    isProfileComplete(contact) {
        const allFields = app.getAllFields();
        const requiredFields = allFields.filter(f => f.required);
        
        for (let field of requiredFields) {
            if (!contact[field.id] || contact[field.id] === '') {
                return false;
            }
        }
        return true;
    },

    toggleFilterDropdown(filterType, event) {
        console.log('🔽 toggleFilterDropdown called for:', filterType);
        event.stopPropagation();
        
        const dropdown = document.getElementById('filterDropdown');
        const dropdownContent = document.getElementById('filterDropdownContent');
        const button = event.currentTarget;
        
        // Si on clique sur le même filtre, fermer le dropdown
        if (this.currentFilterDropdown === filterType && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
            this.currentFilterDropdown = null;
            return;
        }
        
        this.currentFilterDropdown = filterType;
        
        // Générer les options en fonction du type de filtre
        let options = [];
        
        if (filterType === 'complete') {
            // Filtre spécial "Profil complet"
            options = [
                { value: 'oui', label: '✅ Oui' },
                { value: 'non', label: '❌ Non' }
            ];
        } else if (filterType === 'country') {
            // Filtre spécial "Pays"
            // Extraire tous les pays uniques des contacts
            const countries = new Set();
            app.dataStore.contacts.forEach(contact => {
                const allFields = app.getAllFields();
                const cityFields = allFields.filter(f => f.type === 'city');
                
                if (cityFields.length > 0 && contact[cityFields[0].id]) {
                    try {
                        const cityData = JSON.parse(contact[cityFields[0].id]);
                        if (cityData.country) {
                            countries.add(cityData.country);
                        } else {
                            countries.add('Non défini');
                        }
                    } catch (e) {
                        // Si ce n'est pas du JSON, c'est peut-être juste le texte
                        const parts = contact[cityFields[0].id].split(',');
                        if (parts.length > 1) {
                            countries.add(parts[parts.length - 1].trim());
                        } else {
                            countries.add('Non défini');
                        }
                    }
                } else {
                    countries.add('Non défini');
                }
            });
            
            // Convertir en tableau et trier
            const countriesArray = Array.from(countries).sort();
            options = countriesArray.map(country => {
                // Obtenir le drapeau si disponible
                let flag = '🌍';
                if (typeof city !== 'undefined' && city.getCountryFlag) {
                    flag = city.getCountryFlag(country);
                }
                return {
                    value: country,
                    label: `${flag} ${country}`
                };
            });
        } else {
            // Champ normal
            const allFields = app.getAllFields();
            const field = allFields.find(f => f.id === filterType);
            
            if (!field) {
                console.error('Field not found:', filterType);
                return;
            }
            
            if (field.type === 'select' || field.type === 'radio') {
                // Utiliser les tags/options du champ
                if (field.tags) {
                    options = field.tags.map(tag => ({
                        value: tag.value,
                        label: tag.label
                    }));
                } else if (field.options) {
                    options = field.options.map(opt => ({
                        value: opt,
                        label: opt
                    }));
                }
            } else if (field.type === 'checkbox') {
                options = [
                    { value: true, label: '✅ Oui' },
                    { value: false, label: '❌ Non' }
                ];
            }
        }
        
        // Générer le HTML des options
        let html = `<div class="filter-dropdown-title">${filterType === 'complete' ? 'Profil complet' : filterType === 'country' ? 'Pays' : app.getAllFields().find(f => f.id === filterType)?.label || filterType}</div>`;
        html += '<div class="filter-dropdown-options">';
        
        options.forEach(option => {
            const isActive = this.activeFilters[filterType]?.includes(option.value) ? 'active' : '';
            html += `
                <div class="filter-dropdown-option ${isActive}" 
                     onclick="contacts.toggleFilter('${filterType}', '${option.value}')">
                    <span>${option.label}</span>
                    <span class="filter-check">✓</span>
                </div>
            `;
        });
        
        html += '</div>';
        dropdownContent.innerHTML = html;
        
        // Positionner le dropdown sous le bouton
        const rect = button.getBoundingClientRect();
        dropdown.style.display = 'block';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
    },

    toggleFilter(filterType, value) {
        console.log('🔘 toggleFilter:', filterType, value);
        
        if (!this.activeFilters[filterType]) {
            this.activeFilters[filterType] = [];
        }
        
        const index = this.activeFilters[filterType].indexOf(value);
        if (index > -1) {
            // Désactiver le filtre
            this.activeFilters[filterType].splice(index, 1);
        } else {
            // Activer le filtre
            this.activeFilters[filterType].push(value);
        }
        
        // Mettre à jour l'affichage du bouton
        const button = document.getElementById(`filter_${filterType}_Btn`);
        if (button) {
            if (this.activeFilters[filterType].length > 0) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
        
        // Afficher/masquer le bouton de reset
        this.updateResetButton();
        
        // Mettre à jour l'option dans le dropdown
        this.toggleFilterDropdown(filterType, { currentTarget: button, stopPropagation: () => {} });
        
        // Re-render les contacts
        this.render();
    },

    updateResetButton() {
        const resetBtn = document.getElementById('filterResetBtn');
        if (!resetBtn) return;
        
        // Vérifier si au moins un filtre est actif
        const hasActiveFilters = Object.values(this.activeFilters).some(arr => arr.length > 0);
        
        if (hasActiveFilters) {
            resetBtn.style.display = 'inline-flex';
        } else {
            resetBtn.style.display = 'none';
        }
    },

    updateFilterButtons() {
        // Mettre à jour l'affichage de tous les boutons de filtre selon l'état des filtres actifs
        Object.keys(this.activeFilters).forEach(filterType => {
            const button = document.getElementById(`filter_${filterType}_Btn`);
            if (button) {
                if (this.activeFilters[filterType].length > 0) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });
        
        this.updateResetButton();
    },

    resetFilters() {
        console.log('🔄 resetFilters called');
        
        // Réinitialiser tous les filtres
        Object.keys(this.activeFilters).forEach(key => {
            this.activeFilters[key] = [];
        });
        
        // Retirer la classe active de tous les boutons de filtre
        document.querySelectorAll('.filter-chip.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Masquer le bouton de reset
        this.updateResetButton();
        
        // Fermer le dropdown
        const dropdown = document.getElementById('filterDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        this.currentFilterDropdown = null;
        
        // Re-render les contacts
        this.render();
    },

    // Appliquer un filtre depuis les stats (fonction appelée depuis stats.js)
    applyFilterFromStats(filterType, filterValue) {
        console.log('📊 applyFilterFromStats:', filterType, filterValue);
        
        // Réinitialiser tous les filtres
        this.resetFilters();
        
        // Appliquer le nouveau filtre
        if (!this.activeFilters[filterType]) {
            this.activeFilters[filterType] = [];
        }
        this.activeFilters[filterType].push(filterValue);
        
        // Mettre à jour l'affichage du bouton
        const button = document.getElementById(`filter_${filterType}_Btn`);
        if (button) {
            button.classList.add('active');
        }
        
        // Afficher le bouton de reset
        this.updateResetButton();
        
        // Naviguer vers la page contacts
        app.showSection('contacts');
        
        // Re-render les contacts
        this.render();
    },

    viewProfile(contactId) {
        this.currentViewId = contactId;
        const contact = app.dataStore.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const modal = document.getElementById('viewModal');
        const content = document.getElementById('viewModalContent');
        
        let html = `
            <div class="view-header">
                <div class="view-avatar">
                    ${contact.profilePicUrl ? 
                        `<img src="${contact.profilePicUrl}" alt="${contact.firstName}">` :
                        `<div class="view-initial">${(contact.firstName || '?').charAt(0).toUpperCase()}</div>`
                    }
                </div>
                <div class="view-title">
                    <h2>${contact.firstName || 'Sans nom'}</h2>
                    <div class="view-instagram">@${contact.instagram || ''}</div>
                </div>
            </div>
            
            <div class="view-actions">
                <button class="btn-icon" onclick="contacts.openEditModal('${contact.id}')" title="Modifier">✏️</button>
                <button class="btn-icon" onclick="contacts.deleteContact('${contact.id}')" title="Supprimer">🗑️</button>
            </div>
            
            <div class="view-fields">
        `;
        
        // Afficher tous les champs remplis
        const allFields = app.getAllFields();
        
        allFields.forEach(field => {
            const value = contact[field.id];
            
            if (value === undefined || value === null || value === '') {
                return; // Skip empty fields
            }
            
            let displayValue = value;
            
            // Formater la valeur selon le type
            if (field.type === 'select' || field.type === 'radio') {
                const tag = getTags().findTag(field.id, value);
                if (tag) {
                    displayValue = `<span class="${tag.class}">${tag.label}</span>`;
                }
            } else if (field.type === 'checkbox') {
                displayValue = value === true || value === 'true' ? '✅ Oui' : '❌ Non';
            } else if (field.type === 'date') {
                // Formater la date
                const date = new Date(value + 'T00:00:00');
                displayValue = date.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                });
            } else if (field.type === 'birthdate') {
                // Format spécial pour birthdate (jour + mois)
                const date = new Date(value + 'T00:00:00');
                displayValue = date.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long'
                });
            } else if (field.type === 'city') {
                try {
                    const cityData = JSON.parse(value);
                    // Afficher ville + pays avec drapeau
                    let flag = '🌍';
                    if (typeof city !== 'undefined' && cityData.countryCode) {
                        flag = city.getFlag(cityData.countryCode);
                    }
                    displayValue = `${cityData.city ? cityData.city + ', ' : ''}${flag} ${cityData.country || ''}`;
                } catch (e) {
                    // Si ce n'est pas du JSON, afficher tel quel
                    displayValue = value;
                }
            } else if (field.type === 'tel') {
                displayValue = `<a href="tel:${value}">${value}</a>`;
            } else if (field.type === 'email') {
                displayValue = `<a href="mailto:${value}">${value}</a>`;
            } else if (field.type === 'url') {
                displayValue = `<a href="${value}" target="_blank">${value}</a>`;
            }
            
            html += `
                <div class="view-field">
                    <div class="view-field-label">${field.label}</div>
                    <div class="view-field-value">${displayValue}</div>
                </div>
            `;
        });
        
        html += '</div>';
        
        content.innerHTML = html;
        modal.classList.add('active');
        modal.scrollTop = 0;
    },

    openEditModal(contactId) {
        this.currentEditId = contactId;
        const contact = app.dataStore.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        // Fermer la modal de visualisation
        document.getElementById('viewModal').classList.remove('active');
        
        const modal = document.getElementById('editModal');
        const form = document.getElementById('editContactForm');
        
        // Générer le formulaire
        let html = '';
        
        // Champs fixes
        html += `
            <div class="form-group">
                <label>Prénom <span style="color: #ff4757;">*</span></label>
                <input type="text" id="editFirstName" value="${contact.firstName || ''}" required>
            </div>
            
            <div class="form-group">
                <label>Instagram <span style="color: #ff4757;">*</span></label>
                <input type="text" id="editInstagram" value="${contact.instagram || ''}" required>
            </div>
            
            <div class="form-group">
                <label>URL Photo de profil</label>
                <input type="url" id="editProfilePicUrl" value="${contact.profilePicUrl || ''}" placeholder="https://...">
            </div>
        `;
        
        // Champs personnalisables
        const allFields = app.getAllFields();
        
        allFields.forEach(field => {
            if (field.id === 'birthdate') {
                html += this.renderBirthdateField(field, contact);
            } else {
                html += this.renderField(field);
            }
        });
        
        form.innerHTML = html;
        modal.classList.add('active');
        modal.scrollTop = 0;
        
        // Initialiser les champs city après le rendu
        setTimeout(() => {
            this.initCityFields();
            this.populateEditForm(contact);
        }, 100);
    },

    populateEditForm(contact) {
        // Remplir les champs avec les valeurs du contact
        const allFields = app.getAllFields();
        
        allFields.forEach(field => {
            const value = contact[field.id];
            
            if (value === undefined || value === null) {
                return;
            }
            
            if (field.type === 'select') {
                // Pour les selects avec tag-selector
                const hiddenInput = document.getElementById(field.id);
                const display = document.getElementById(field.id + 'Display');
                if (hiddenInput) {
                    hiddenInput.value = value;
                }
                if (display) {
                    const tag = getTags().findTag(field.id, value);
                    if (tag) {
                        display.textContent = tag.label;
                        display.className = 'tag-selector-value';
                    }
                }
            } else if (field.type === 'radio') {
                const radio = document.querySelector(`input[name="${field.id}"][value="${value}"]`);
                if (radio) {
                    radio.checked = true;
                }
            } else if (field.type === 'checkbox') {
                const checkbox = document.getElementById(field.id);
                if (checkbox) {
                    checkbox.checked = (value === true || value === 'true');
                }
            } else if (field.type === 'birthdate') {
                // Format: YYYY-MM-DD
                if (value) {
                    const parts = value.split('-');
                    if (parts.length === 3) {
                        const daySelect = document.getElementById('birthday_day');
                        const monthSelect = document.getElementById('birthday_month');
                        const yearSelect = document.getElementById('birthday_year');
                        
                        if (daySelect) daySelect.value = parseInt(parts[2], 10);
                        if (monthSelect) monthSelect.value = parseInt(parts[1], 10);
                        if (yearSelect) yearSelect.value = parseInt(parts[0], 10);
                    }
                }
            } else if (field.type === 'city') {
                const input = document.getElementById(field.id);
                if (input) {
                    try {
                        const cityData = JSON.parse(value);
                        input.value = cityData.displayName || value;
                        input.setAttribute('data-city-json', value);
                    } catch (e) {
                        input.value = value;
                    }
                }
            } else {
                // Champ simple
                const input = document.getElementById(field.id);
                if (input) {
                    input.value = value;
                }
            }
        });
    },

    async saveEdit() {
        const contactId = this.currentEditId;
        if (!contactId) return;
        
        const contact = app.dataStore.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        // Récupérer les valeurs
        const firstName = document.getElementById('editFirstName').value.trim();
        const instagram = document.getElementById('editInstagram').value.trim();
        const profilePicUrl = document.getElementById('editProfilePicUrl').value.trim();
        
        if (!firstName || !instagram) {
            alert('Le prénom et Instagram sont obligatoires');
            return;
        }
        
        // Mettre à jour le contact
        contact.firstName = firstName;
        contact.instagram = instagram;
        contact.profilePicUrl = profilePicUrl;
        
        // Récupérer les valeurs des champs personnalisables
        const allFields = app.getAllFields();
        
        allFields.forEach(field => {
            if (field.type === 'select') {
                const value = document.getElementById(field.id)?.value;
                if (value !== undefined) {
                    contact[field.id] = value;
                }
            } else if (field.type === 'radio') {
                const radio = document.querySelector(`input[name="${field.id}"]:checked`);
                if (radio) {
                    contact[field.id] = radio.value;
                }
            } else if (field.type === 'checkbox') {
                const checkbox = document.getElementById(field.id);
                if (checkbox) {
                    contact[field.id] = checkbox.checked;
                }
            } else if (field.type === 'birthdate') {
                const day = document.getElementById('birthday_day')?.value;
                const month = document.getElementById('birthday_month')?.value;
                const year = document.getElementById('birthday_year')?.value;
                
                if (day && month) {
                    const yearValue = year || new Date().getFullYear();
                    contact[field.id] = `${yearValue}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    contact.birthYear = year || null;
                }
            } else if (field.type === 'city') {
                const input = document.getElementById(field.id);
                if (input) {
                    const cityJson = input.getAttribute('data-city-json');
                    if (cityJson) {
                        contact[field.id] = cityJson;
                    } else {
                        contact[field.id] = input.value;
                    }
                }
            } else {
                const input = document.getElementById(field.id);
                if (input) {
                    contact[field.id] = input.value;
                }
            }
        });
        
        // Sauvegarder dans Firebase
        await app.saveToFirebase();
        
        // Fermer la modal et rafraîchir
        document.getElementById('editModal').classList.remove('active');
        this.render();
        
        console.log('✅ Contact updated');
    },

    async deleteContact(contactId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
            return;
        }
        
        const index = app.dataStore.contacts.findIndex(c => c.id === contactId);
        if (index === -1) return;
        
        app.dataStore.contacts.splice(index, 1);
        
        await app.saveToFirebase();
        
        document.getElementById('viewModal').classList.remove('active');
        this.render();
        
        console.log('✅ Contact deleted');
    },

    closeViewModal() {
        document.getElementById('viewModal').classList.remove('active');
        this.currentViewId = null;
    },

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        this.currentEditId = null;
    },

    renderBirthdateField(dateField, contact = null) {
        const dayOptions = Array.from({length: 31}, (_, i) => i + 1)
            .map(day => `<option value="${day}">${day}</option>`)
            .join('');
        
        const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        const monthOptions = months
            .map((month, i) => `<option value="${i + 1}">${month}</option>`)
            .join('');
        
        const currentYear = new Date().getFullYear();
        const yearOptions = Array.from({length: 100}, (_, i) => currentYear - i)
            .map(year => `<option value="${year}">${year}</option>`)
            .join('');
        
        const dateRequired = dateField.required ? '<span style="color: #ff4757;">*</span>' : '';
        
        return `
            <div class="form-group">
                <label style="display: block; margin-bottom: 8px;">${dateField.label} ${dateRequired}</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <select id="birthday_day" class="birth-select">
                        <option value="">Jour</option>
                        ${dayOptions}
                    </select>
                    <select id="birthday_month" class="birth-select">
                        <option value="">Mois</option>
                        ${monthOptions}
                    </select>
                    <select id="birthday_year" class="birth-select">
                        <option value="">Année</option>
                        ${yearOptions}
                    </select>
                </div>
                <input type="hidden" id="birthYear">
                <input type="hidden" id="${dateField.id}" ${dateField.required ? 'required' : ''}>
            </div>
        `;
    },

    renderField(field) {
        const requiredMark = field.required ? '<span style="color: #ff4757;">*</span>' : '';
        
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
                        <textarea id="${field.id}" ${field.required ? 'required' : ''}></textarea>
                    </div>
                `;
            
            case 'number':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="number" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'year':
                // Générer les années de 1940 à aujourd'hui
                const currentYear = new Date().getFullYear();
                const years = [];
                for (let year = currentYear; year >= 1940; year--) {
                    years.push(year);
                }
                const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <select id="${field.id}" ${field.required ? 'required' : ''}>
                            <option value="">Sélectionner...</option>
                            ${yearOptions}
                        </select>
                    </div>
                `;
            
            case 'date':
                const minDate = field.futureOnly ? `min="${new Date().toISOString().split('T')[0]}"` : '';
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <div style="position: relative;">
                            <input type="date" class="date-input" id="${field.id}" ${minDate} ${field.required ? 'required' : ''} 
                                   placeholder="jj/mm/aaaa"
                                   data-placeholder="jj/mm/aaaa"
                                   onfocus="this.showPicker ? this.showPicker() : null"
                                   onclick="this.showPicker ? this.showPicker() : null">
                            <span class="date-placeholder">jj/mm/aaaa</span>
                        </div>
                    </div>
                `;
            
            case 'city':
                return `
                    <div class="form-group" style="position: relative;">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="text" id="${field.id}" ${field.required ? 'required' : ''} autocomplete="off">
                    </div>
                `;
            
            case 'tel':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="tel" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'email':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="email" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'url':
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="url" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
            
            case 'text':
            default:
                return `
                    <div class="form-group">
                        <label>${field.label} ${requiredMark}</label>
                        <input type="text" id="${field.id}" ${field.required ? 'required' : ''}>
                    </div>
                `;
        }
    },

    // Initialiser les champs de type city avec autocomplétion
    initCityFields() {
        console.log('🌍 initCityFields called');
        
        if (typeof city === 'undefined') {
            console.error('❌ city module not loaded');
            return;
        }
        
        const allFields = app.getAllFields();
        const cityFields = allFields.filter(f => f.type === 'city');
        
        console.log('📍 Found city fields:', cityFields.length, cityFields.map(f => f.id));
        
        // Attendre que le DOM soit prêt
        setTimeout(() => {
            cityFields.forEach(field => {
                const inputId = field.id;
                const input = document.getElementById(inputId);
                
                if (!input) {
                    console.error(`❌ Input not found for city field: ${inputId}`);
                    return;
                }
                
                console.log(`✅ Initializing city field: ${inputId}`);
                
                city.initCityField(inputId, (cityData) => {
                    // Stocker les données de la ville en JSON
                    const input = document.getElementById(inputId);
                    if (input) {
                        input.setAttribute('data-city-json', JSON.stringify(cityData));
                    }
                });
            });
        }, 100); // Petit délai pour s'assurer que le DOM est rendu
    }
};
