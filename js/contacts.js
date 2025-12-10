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
        complete: [], // 'oui' ou 'non'
        country: [] // Filtre par pays
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
                    const char = name.charAt(i);
                    // Vérifier si c'est une lettre (A-Z, a-z, lettres accentuées)
                    if (/[a-zA-ZÀ-ÿ]/.test(char)) {
                        return char.toUpperCase();
                    }
                }
                // Si aucune lettre trouvée, retourner '#'
                return '#';
            };
            
            const firstLetter = getFirstLetter(contact.firstName);
            if (!groupedContacts[firstLetter]) {
                groupedContacts[firstLetter] = [];
                letters.push(firstLetter);
            }
            groupedContacts[firstLetter].push(contact);
        });
        
        // Trier les lettres (# à la fin)
        letters.sort((a, b) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        });
        
        // Générer le HTML avec des séparateurs de lettres
        let html = '';
        letters.forEach(letter => {
            html += `<div class="letter-divider" data-letter="${letter}" id="letter-${letter}">${letter}</div>`;
            
            groupedContacts[letter].forEach(contact => {
                const relTag = tags.findTag('relationType', contact.relationType);
                const meetTag = tags.findTag('meetingPlace', contact.meetingPlace);
                const statTag = tags.findTag('discussionStatus', contact.discussionStatus);
                
                // Extraire le drapeau du pays si disponible
                let locationData = null;
                if (contact.location) {
                    // Si c'est déjà un objet (depuis Firebase)
                    if (typeof contact.location === 'object') {
                        locationData = contact.location;
                    }
                    // Si c'est un JSON stringifié
                    else if (typeof contact.location === 'string' && contact.location.startsWith('{')) {
                        try {
                            locationData = JSON.parse(contact.location);
                        } catch (e) {
                            locationData = typeof city !== 'undefined' ? city.parseLocation(contact.location) : null;
                        }
                    }
                    // Sinon, c'est du texte simple
                    else {
                        locationData = typeof city !== 'undefined' ? city.parseLocation(contact.location) : null;
                    }
                }
                const flag = locationData && locationData.flag ? `<span class="contact-flag">${locationData.flag}</span>` : '';
                
                html += `
                <div class="contact-card">
                    <div class="contact-header">
                        <div class="contact-info">
                            <div class="contact-name">${contact.firstName}${flag}</div>
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
        let result = [...app.dataStore.contacts];
        
        // Filtrer les contacts qui sont dans la liste "À ne plus suivre"
        if (typeof unfollowers !== 'undefined' && unfollowers.data.doNotFollowList) {
            result = result.filter(contact => {
                const instagramUsername = contact.instagram.toLowerCase().replace('@', '');
                return !unfollowers.data.doNotFollowList.has(instagramUsername);
            });
        }
        
        // Appliquer la recherche textuelle
        const searchBox = document.getElementById('searchBox');
        const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : '';
        
        if (searchTerm) {
            result = result.filter(contact => {
                const firstName = contact.firstName.toLowerCase().replace(/^@+/, ''); // Enlever les @ au début
                const instagram = contact.instagram.toLowerCase().replace('@', '');
                return firstName.startsWith(searchTerm) || instagram.startsWith(searchTerm);
            });
        }
        
        // Appliquer les filtres par champs
        const allFields = app.getAllFields();
        const filterableFields = allFields.filter(field => 
            field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
        );
        
        filterableFields.forEach(field => {
            const filters = this.activeFilters[field.id];
            if (filters && filters.length > 0) {
                result = result.filter(contact => {
                    const value = contact[field.id];
                    
                    if (field.type === 'checkbox') {
                        // Pour checkbox: vérifier oui/non
                        if (filters.includes('oui')) {
                            return value === true || value === 'true';
                        }
                        if (filters.includes('non')) {
                            return value === false || value === 'false' || !value;
                        }
                    } else {
                        // Pour select/radio: vérifier la valeur exacte
                        return filters.includes(value);
                    }
                    return false;
                });
            }
        });
        
        // Filtre profil complet
        if (this.activeFilters.complete && this.activeFilters.complete.length > 0) {
            result = result.filter(contact => {
                const isComplete = this.isProfileComplete(contact);
                if (this.activeFilters.complete.includes('oui')) return isComplete;
                if (this.activeFilters.complete.includes('non')) return !isComplete;
                return false;
            });
        }
        
        // Filtre par pays
        if (this.activeFilters.country && this.activeFilters.country.length > 0) {
            result = result.filter(contact => {
                // Parser la location du contact
                let locationData = null;
                if (contact.location) {
                    if (typeof contact.location === 'object') {
                        locationData = contact.location;
                    } else if (typeof contact.location === 'string' && contact.location.startsWith('{')) {
                        try {
                            locationData = JSON.parse(contact.location);
                        } catch (e) {
                            locationData = typeof city !== 'undefined' ? city.parseLocation(contact.location) : null;
                        }
                    } else {
                        locationData = typeof city !== 'undefined' ? city.parseLocation(contact.location) : null;
                    }
                }
                
                const country = locationData && locationData.country ? locationData.country : 'Non défini';
                return this.activeFilters.country.includes(country);
            });
        }
        
        // Sort by firstName
        result.sort((a, b) => {
            const aName = a.firstName.replace(/^@+/, '');
            const bName = b.firstName.replace(/^@+/, '');
            return aName.localeCompare(bName);
        });
        
        return result;
    },

    isProfileComplete(contact) {
        // Récupérer tous les champs obligatoires
        const allFields = app.getAllFields();
        const requiredFields = allFields.filter(field => field.required);
        
        // Vérifier que tous les champs obligatoires sont remplis
        for (const field of requiredFields) {
            const value = contact[field.id];
            if (!value || value === '' || value === null || value === undefined) {
                return false;
            }
        }
        
        return true;
    },

    viewProfile(contactId) {
        const contact = app.dataStore.contacts.find(c => c.id === contactId);
        if (!contact) return;

        this.currentViewId = contactId;

        // Prénom et Instagram
        document.getElementById('profileName').textContent = contact.firstName;
        document.getElementById('profileInsta').href = `https://instagram.com/${contact.instagram.replace('@', '')}`;
        document.getElementById('profileInsta').textContent = contact.instagram;

        // Générer dynamiquement les détails
        const allFields = app.getAllFields();
        const detailsContainer = document.getElementById('profileInfo');
        
        let detailsHTML = '';
        let birthYearValue = null;
        let birthdayValue = null;
        
        allFields.forEach(field => {
            const value = contact[field.id];
            
            // Capturer birthYear et birthday pour les fusionner
            if (field.id === 'birthYear') {
                birthYearValue = value;
                return; // Ne pas afficher séparément
            }
            if (field.id === 'birthday') {
                birthdayValue = value;
                return; // Ne pas afficher séparément
            }
            
            if (value !== undefined && value !== null && value !== '') {
                let displayValue = value;
                
                if (field.type === 'select' || field.type === 'radio') {
                    // Pour les champs avec tags, afficher le tag formaté
                    const tag = tags.findTag(field.id, value);
                    if (tag) {
                        displayValue = `<span class="tag-mini ${tag.class}">${tag.label}</span>`;
                    } else if (field.type === 'radio' && field.options) {
                        // Pour les radio, chercher dans les options
                        displayValue = value;
                    }
                } else if (field.type === 'checkbox') {
                    displayValue = (value === true || value === 'true') ? '✅ Oui' : '❌ Non';
                } else if (field.type === 'city') {
                    // Pour les champs city, parser et afficher le displayName avec le drapeau
                    let locationData = null;
                    
                    // Si c'est déjà un objet (depuis Firebase)
                    if (typeof value === 'object') {
                        locationData = value;
                    }
                    // Si c'est un JSON stringifié
                    else if (typeof value === 'string' && value.startsWith('{')) {
                        try {
                            locationData = JSON.parse(value);
                        } catch (e) {
                            locationData = typeof city !== 'undefined' ? city.parseLocation(value) : null;
                        }
                    }
                    // Sinon, c'est du texte simple
                    else {
                        locationData = typeof city !== 'undefined' ? city.parseLocation(value) : null;
                    }
                    
                    if (locationData && locationData.flag) {
                        displayValue = `${locationData.flag} ${locationData.displayName || locationData.country || value}`;
                    } else {
                        displayValue = value;
                    }
                } else if (field.type === 'textarea') {
                    displayValue = value.replace(/\n/g, '<br>');
                }
                
                detailsHTML += `
                    <div class="view-detail-item">
                        <div class="view-detail-label">${field.label}</div>
                        <div class="view-detail-value">${displayValue}</div>
                    </div>
                `;
            }
        });
        
        // Ajouter le champ fusionné "Naissance" si birthYear ou birthday existe
        if (birthdayValue || birthYearValue) {
            let birthDisplay = '';
            
            if (birthdayValue) {
                // Date complète : afficher en toutes lettres (ex: 17 janvier 2000)
                const [year, month, day] = birthdayValue.split('-');
                const monthNames = [
                    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
                ];
                const monthName = monthNames[parseInt(month) - 1];
                birthDisplay = `${parseInt(day)} ${monthName} ${year}`;
            } else if (birthYearValue) {
                // Seulement l'année
                birthDisplay = birthYearValue;
            }
            
            detailsHTML += `
                <div class="view-detail-item">
                    <div class="view-detail-label">Naissance</div>
                    <div class="view-detail-value">${birthDisplay}</div>
                </div>
            `;
        }
        
        detailsContainer.innerHTML = detailsHTML;
        
        // Reset scroll to top of modal
        const viewModal = document.getElementById('viewModal');
        viewModal.classList.add('active');
        viewModal.scrollTop = 0;
    },

    editProfile(contactId) {
        // Si aucun ID n'est passé, utiliser currentViewId
        if (!contactId) {
            contactId = this.currentViewId;
        }
        
        const contact = app.dataStore.contacts.find(c => c.id === contactId);
        if (!contact) return;

        app.closeViewModal();
        
        this.currentEditId = contactId;
        
        // Générer le formulaire dynamiquement
        this.renderDynamicForm();
        
        // Initialiser les champs city
        this.initCityFields();

        // Remplir le formulaire
        document.getElementById('firstName').value = contact.firstName;
        document.getElementById('instagram').value = contact.instagram.replace('@', '');

        // Remplir les champs dynamiques
        const allFields = app.getAllFields();
        allFields.forEach(field => {
            const value = contact[field.id];
            
            if (field.id === 'birthday') {
                // Cas spécial : birthday avec 3 selects
                const daySelect = document.getElementById('birthday_day');
                const monthSelect = document.getElementById('birthday_month');
                const yearSelect = document.getElementById('birthday_year');
                const birthdayInput = document.getElementById('birthday');
                const birthYearInput = document.getElementById('birthYear');
                
                if (value) {
                    // Si birthday (date complète) existe, le charger
                    const [year, month, day] = value.split('-');
                    if (daySelect) daySelect.value = parseInt(day);
                    if (monthSelect) monthSelect.value = parseInt(month);
                    if (yearSelect) yearSelect.value = year;
                    if (birthdayInput) birthdayInput.value = value;
                    if (birthYearInput) birthYearInput.value = year;
                } else if (contact.birthYear) {
                    // Sinon, si juste birthYear existe, charger uniquement l'année
                    if (yearSelect) yearSelect.value = contact.birthYear;
                    if (birthYearInput) birthYearInput.value = contact.birthYear;
                }
            } else if (field.id === 'birthYear') {
                // Ne rien faire, déjà géré dans birthday
                return;
            } else if (field.type === 'select') {
                // Tag selector
                const hiddenInput = document.getElementById(field.id);
                const displayEl = document.getElementById(field.id + 'Display');
                if (hiddenInput && displayEl && value) {
                    hiddenInput.value = value;
                    const tag = tags.findTag(field.id, value);
                    if (tag) {
                        displayEl.textContent = tag.label;
                        displayEl.className = 'tag-selector-value';
                    }
                }
            } else if (field.type === 'radio') {
                // Radio buttons
                if (field.options) {
                    field.options.forEach((opt, index) => {
                        const radio = document.getElementById(`${field.id}_${index}`);
                        if (radio && value === opt) {
                            radio.checked = true;
                        }
                    });
                }
            } else if (field.type === 'checkbox') {
                const checkbox = document.getElementById(field.id);
                if (checkbox) {
                    checkbox.checked = (value === true || value === 'true');
                }
            } else if (field.type === 'city') {
                // Champ city : parser la valeur et remplir
                const input = document.getElementById(field.id);
                if (input && value) {
                    let cityData = null;
                    
                    // Si c'est déjà un objet
                    if (typeof value === 'object') {
                        cityData = value;
                    }
                    // Sinon, essayer de parser
                    else {
                        cityData = typeof city !== 'undefined' ? city.parseLocation(value) : null;
                    }
                    
                    if (cityData) {
                        input.value = cityData.displayName || cityData.country || value;
                        input.setAttribute('data-city-json', JSON.stringify(cityData));
                    } else {
                        // Si on ne peut pas parser, juste afficher la valeur texte
                        input.value = value;
                    }
                }
            } else {
                // Text, textarea, number, date, etc.
                const input = document.getElementById(field.id);
                if (input && value !== undefined && value !== null) {
                    input.value = value;
                }
            }
        });

        document.getElementById('modalTitle').textContent = '✏️ Modifier le contact';
        
        // Reset scroll to top of modal
        const addModal = document.getElementById('addModal');
        addModal.classList.add('active');
        addModal.scrollTop = 0;
    },

    async saveContact(event) {
        event.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const instagram = '@' + document.getElementById('instagram').value.replace('@', '');

        // Collecter tous les champs dynamiques
        const allFields = app.getAllFields();
        const contactData = {
            firstName,
            instagram
        };

        allFields.forEach(field => {
            if (field.type === 'select') {
                const value = document.getElementById(field.id)?.value || '';
                contactData[field.id] = value;
            } else if (field.type === 'radio') {
                const radios = document.getElementsByName(field.id);
                let selectedValue = '';
                radios.forEach(radio => {
                    if (radio.checked) {
                        selectedValue = radio.value;
                    }
                });
                contactData[field.id] = selectedValue;
            } else if (field.type === 'checkbox') {
                const checkbox = document.getElementById(field.id);
                contactData[field.id] = checkbox ? checkbox.checked : false;
            } else if (field.type === 'city') {
                // Pour les champs city, récupérer les données JSON ou le texte
                const input = document.getElementById(field.id);
                if (input) {
                    const cityJson = input.getAttribute('data-city-json');
                    if (cityJson) {
                        // Si on a un JSON, le parser pour sauvegarder l'objet (pas la string)
                        try {
                            contactData[field.id] = JSON.parse(cityJson);
                        } catch (e) {
                            // Si le parsing échoue, sauvegarder le texte brut
                            contactData[field.id] = input.value;
                        }
                    } else {
                        // Sinon, sauvegarder le texte brut
                        contactData[field.id] = input.value;
                    }
                }
            } else {
                const input = document.getElementById(field.id);
                contactData[field.id] = input ? input.value : '';
            }
        });

        // Ancienne logique de compatibilité pour le genre (si pas de valeur dans le nouveau système)
        if (!contactData.gender || contactData.gender === '') {
            const genderMale = document.getElementById('genderMale');
            const genderFemale = document.getElementById('genderFemale');
            if (genderMale && genderMale.checked) {
                contactData.gender = '👨 Homme';
            } else if (genderFemale && genderFemale.checked) {
                contactData.gender = '👩 Femme';
            }
        }

        if (this.currentEditId) {
            const contact = app.dataStore.contacts.find(c => c.id === this.currentEditId);
            Object.assign(contact, contactData);
            contact.dateModified = new Date().toISOString(); // Mettre à jour la date de modification
            await app.dataStore.save(contact);
        } else {
            const newContact = {
                id: Date.now().toString(),
                ...contactData,
                dateAdded: new Date().toISOString(),
                dateModified: new Date().toISOString() // Initialiser dateModified
            };
            app.dataStore.contacts.push(newContact);
            await app.dataStore.save(newContact);
        }

        app.closeAddModal();
        this.render();
        stats.render();
    },

    async deleteContact(contactId) {
        // Si aucun ID n'est passé, utiliser currentViewId
        if (!contactId) {
            contactId = this.currentViewId;
        }
        
        if (!confirm('Voulez-vous vraiment supprimer ce contact ?')) return;

        const index = app.dataStore.contacts.findIndex(c => c.id === contactId);
        if (index !== -1) {
            app.dataStore.contacts.splice(index, 1);
            await app.dataStore.deleteContact(contactId);
        }

        app.closeViewModal();
        this.render();
        stats.render();
    },

    async deleteAndUnfollow(contactId) {
        // Si aucun ID n'est passé, utiliser currentViewId
        if (!contactId) {
            contactId = this.currentViewId;
        }
        
        const contact = app.dataStore.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const username = contact.instagram.toLowerCase().replace('@', '');
        
        if (!confirm(`Supprimer ce contact ET l'ajouter à la liste "À ne plus suivre" ?\n\n@${username} sera définitivement supprimé et vous serez alerté si vous tentez de le re-suivre.`)) {
            return;
        }

        // Ajouter à la liste "À ne plus suivre"
        if (typeof unfollowers !== 'undefined') {
            unfollowers.data.doNotFollowList.add(username);
            unfollowers.saveDoNotFollowList();
        }

        // Supprimer le contact
        const index = app.dataStore.contacts.findIndex(c => c.id === contactId);
        if (index !== -1) {
            app.dataStore.contacts.splice(index, 1);
            await app.dataStore.deleteContact(contactId);
        }

        app.closeViewModal();
        this.render();
        stats.render();
    },

    openInstagram() {
        // Cette fonction est appelée quand on clique sur le pseudo Instagram
        // Le lien est déjà géré par le href dans le HTML, donc cette fonction peut être vide
        // ou on peut l'utiliser pour des analytics si besoin
    },

    // ==========================================
    // GESTION DES FILTRES
    // ==========================================

    toggleFilterDropdown(filterType, event) {
        event?.stopPropagation();
        
        const dropdown = document.getElementById('filterDropdown');
        const content = document.getElementById('filterDropdownContent');
        
        // Si on clique sur le même filtre, fermer
        if (this.currentFilterDropdown === filterType && dropdown.style.display === 'block') {
            this.closeFilterDropdown();
            return;
        }
        
        this.currentFilterDropdown = filterType;
        
        // Scroller le filtre cliqué au centre de la barre de filtres
        const btn = event?.target.closest('.filter-chip');
        if (btn) {
            const filtersContainer = document.querySelector('.filters-horizontal');
            const btnRect = btn.getBoundingClientRect();
            const containerRect = filtersContainer.getBoundingClientRect();
            
            // Calculer la position pour centrer le bouton
            const btnCenter = btnRect.left + btnRect.width / 2;
            const containerCenter = containerRect.left + containerRect.width / 2;
            const scrollOffset = btnCenter - containerCenter;
            
            // Scroller pour centrer le bouton
            filtersContainer.scrollBy({
                left: scrollOffset,
                behavior: 'smooth'
            });
            
            // Attendre la fin du scroll pour positionner le dropdown
            setTimeout(() => {
                // Positionner le dropdown centré horizontalement sur l'écran
                const rect = btn.getBoundingClientRect();
                const dropdownWidth = 300; // Largeur approximative du dropdown
                const screenWidth = window.innerWidth;
                
                // Centrer le dropdown horizontalement
                const left = Math.max(20, Math.min(
                    (screenWidth - dropdownWidth) / 2,
                    screenWidth - dropdownWidth - 20
                ));
                
                dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                dropdown.style.left = left + 'px';
                dropdown.style.right = 'auto'; // Retirer right pour utiliser left
                dropdown.style.width = dropdownWidth + 'px';
            }, 300); // Attendre la fin de l'animation smooth
        }
        
        // Générer le contenu selon le type de filtre
        if (filterType === 'complete') {
            content.innerHTML = `
                <label class="filter-option">
                    <input type="checkbox" value="oui" ${this.activeFilters.complete.includes('oui') ? 'checked' : ''} 
                           onchange="contacts.toggleFilter('complete', 'oui')">
                    <span>✅ Oui</span>
                </label>
                <label class="filter-option">
                    <input type="checkbox" value="non" ${this.activeFilters.complete.includes('non') ? 'checked' : ''} 
                           onchange="contacts.toggleFilter('complete', 'non')">
                    <span>❌ Non</span>
                </label>
            `;
        } else if (filterType === 'country') {
            // Filtre par pays : récupérer tous les pays des contacts
            if (typeof city !== 'undefined') {
                const countryStats = city.getCountryStats(app.dataStore.contacts);
                content.innerHTML = countryStats.map(stat => `
                    <label class="filter-option">
                        <input type="checkbox" value="${stat.country}" 
                               ${this.activeFilters.country.includes(stat.country) ? 'checked' : ''} 
                               onchange="contacts.toggleFilter('country', '${stat.country.replace(/'/g, "\\'")}')">
                        <span>${stat.flag} ${stat.country} (${stat.count})</span>
                    </label>
                `).join('');
            }
        } else {
            // Trouver le champ correspondant
            const allFields = app.getAllFields();
            const field = allFields.find(f => f.id === filterType);
            
            if (field) {
                if (field.type === 'select' || field.type === 'radio') {
                    // Récupérer les options/tags
                    let options = [];
                    if (field.type === 'select' && field.tags) {
                        options = field.tags.map(tag => ({ value: tag.value, label: tag.label }));
                    } else if (field.type === 'radio' && field.options) {
                        options = field.options.map(opt => ({ value: opt, label: opt }));
                    }
                    
                    content.innerHTML = options.map(opt => `
                        <label class="filter-option">
                            <input type="checkbox" value="${opt.value}" 
                                   ${this.activeFilters[filterType].includes(opt.value) ? 'checked' : ''} 
                                   onchange="contacts.toggleFilter('${filterType}', '${opt.value}')">
                            <span>${opt.label}</span>
                        </label>
                    `).join('');
                } else if (field.type === 'checkbox') {
                    content.innerHTML = `
                        <label class="filter-option">
                            <input type="checkbox" value="oui" ${this.activeFilters[filterType].includes('oui') ? 'checked' : ''} 
                                   onchange="contacts.toggleFilter('${filterType}', 'oui')">
                            <span>✅ Oui</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" value="non" ${this.activeFilters[filterType].includes('non') ? 'checked' : ''} 
                                   onchange="contacts.toggleFilter('${filterType}', 'non')">
                            <span>❌ Non</span>
                        </label>
                    `;
                }
            }
        }
        
        dropdown.style.display = 'block';
        
        // Ajouter un listener pour fermer le dropdown en cliquant n'importe où
        setTimeout(() => {
            document.addEventListener('click', this.handleOutsideClick, { once: true });
        }, 0);
    },
    
    handleOutsideClick(e) {
        // Ne rien faire si on clique à l'intérieur du dropdown
        const dropdown = document.getElementById('filterDropdown');
        if (dropdown && dropdown.contains(e.target)) {
            // Re-ajouter le listener pour le prochain clic
            setTimeout(() => {
                document.addEventListener('click', contacts.handleOutsideClick, { once: true });
            }, 0);
            return;
        }
        
        // Fermer le dropdown
        contacts.closeFilterDropdown();
    },
    
    toggleFilter(filterType, value) {
        if (!this.activeFilters[filterType]) {
            this.activeFilters[filterType] = [];
        }
        
        const index = this.activeFilters[filterType].indexOf(value);
        if (index > -1) {
            this.activeFilters[filterType].splice(index, 1);
        } else {
            this.activeFilters[filterType].push(value);
        }
        
        this.render();
        this.updateFilterButtons();
    },
    
    updateFilterButtons() {
        // Récupérer tous les champs filtrables
        const allFields = app.getAllFields();
        const filterableFields = allFields.filter(field => 
            field.type === 'select' || field.type === 'radio' || field.type === 'checkbox'
        );
        
        let hasAnyFilter = false;
        
        filterableFields.forEach(field => {
            const hasFilter = this.activeFilters[field.id] && this.activeFilters[field.id].length > 0;
            const btn = document.getElementById(`filter_${field.id}_Btn`);
            if (btn) {
                btn.classList.toggle('active', hasFilter);
            }
            if (hasFilter) hasAnyFilter = true;
        });
        
        // Profil complet
        const hasCompleteFilter = this.activeFilters.complete && this.activeFilters.complete.length > 0;
        const completeBtn = document.getElementById('filter_complete_Btn');
        if (completeBtn) {
            completeBtn.classList.toggle('active', hasCompleteFilter);
        }
        if (hasCompleteFilter) hasAnyFilter = true;
        
        // Pays
        const hasCountryFilter = this.activeFilters.country && this.activeFilters.country.length > 0;
        const countryBtn = document.getElementById('filter_country_Btn');
        if (countryBtn) {
            countryBtn.classList.toggle('active', hasCountryFilter);
        }
        if (hasCountryFilter) hasAnyFilter = true;
        
        // Show/hide reset button
        const resetBtn = document.getElementById('filterResetBtn');
        if (resetBtn) {
            resetBtn.style.display = hasAnyFilter ? 'flex' : 'none';
        }
    },
    
    resetFilters() {
        this.activeFilters = {
            gender: [],
            relationType: [],
            meetingPlace: [],
            discussionStatus: [],
            complete: [],
            country: []
        };
        
        // Réinitialiser aussi la barre de recherche
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.value = '';
        }
        
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
        let dynamicFieldsHTML = '';
        
        for (let i = 0; i < allFields.length; i++) {
            const field = allFields[i];
            const nextField = allFields[i + 1];
            
            // Si c'est birthYear, le sauter (il sera intégré dans birthday)
            if (field.id === 'birthYear') {
                continue;
            }
            
            // Si c'est birthday, afficher les 3 selects
            if (field.id === 'birthday') {
                dynamicFieldsHTML += this.renderBirthFields(null, field);
            } else {
                dynamicFieldsHTML += this.renderField(field);
            }
        }

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
        
        // Gérer les placeholders des champs date
        setTimeout(() => {
            const dateInputs = document.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                // Fonction pour vérifier si le champ a une valeur
                const updatePlaceholder = () => {
                    if (input.value) {
                        input.classList.add('has-value');
                    } else {
                        input.classList.remove('has-value');
                    }
                };
                
                // Vérifier au chargement
                updatePlaceholder();
                
                // Vérifier à chaque changement
                input.addEventListener('change', updatePlaceholder);
                input.addEventListener('input', updatePlaceholder);
            });
        }, 50);
        
        // Lier les 3 selects de date de naissance
        setTimeout(() => {
            const daySelect = document.getElementById('birthday_day');
            const monthSelect = document.getElementById('birthday_month');
            const yearSelect = document.getElementById('birthday_year');
            const birthdayInput = document.getElementById('birthday');
            const birthYearInput = document.getElementById('birthYear');
            
            if (daySelect && monthSelect && yearSelect && birthdayInput && birthYearInput) {
                // Fonction pour mettre à jour les champs cachés
                const updateHiddenFields = () => {
                    const day = daySelect.value;
                    const month = monthSelect.value;
                    const year = yearSelect.value;
                    
                    // Toujours sauvegarder l'année si elle est remplie
                    if (year) {
                        birthYearInput.value = year;
                    } else {
                        birthYearInput.value = '';
                    }
                    
                    // Si les 3 sont remplis, créer la date complète
                    if (day && month && year) {
                        const paddedDay = String(day).padStart(2, '0');
                        const paddedMonth = String(month).padStart(2, '0');
                        birthdayInput.value = `${year}-${paddedMonth}-${paddedDay}`;
                    } else {
                        birthdayInput.value = '';
                    }
                };
                
                // Écouter les changements sur les 3 selects
                daySelect.addEventListener('change', updateHiddenFields);
                monthSelect.addEventListener('change', updateHiddenFields);
                yearSelect.addEventListener('change', updateHiddenFields);
            }
        }, 100);
    },

    // Rendre les champs birthYear et birthday sur la même ligne (3 selects)
    renderBirthFields(yearField, dateField) {
        // Générer les années de 1940 à aujourd'hui
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear; year >= 1940; year--) {
            years.push(year);
        }
        const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');
        
        // Générer les mois
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        const monthOptions = months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('');
        
        // Générer les jours (1-31)
        const dayOptions = Array.from({length: 31}, (_, i) => i + 1)
            .map(d => `<option value="${d}">${d}</option>`).join('');
        
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
