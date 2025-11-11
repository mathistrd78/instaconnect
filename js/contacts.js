// contacts.js - Gestion des contacts
const contacts = {
    currentViewId: null,
    currentEditId: null,
    currentFieldType: null,

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

        if (filtered.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        empty.style.display = 'none';
        
        grid.innerHTML = filtered.map(contact => {
            const relTag = tags.findTag('relationType', contact.relationType);
            const meetTag = tags.findTag('meetingPlace', contact.meetingPlace);
            const statTag = tags.findTag('discussionStatus', contact.discussionStatus);
            
            return `
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
        }).join('');
    },

    getFiltered() {
        const search = document.getElementById('searchBox').value.toLowerCase();
        const filterRel = document.getElementById('filterRelation').value;
        const filterLieu = document.getElementById('filterLieu').value;
        const filterStat = document.getElementById('filterStatut').value;

        return app.dataStore.contacts.filter(c => {
            const matchSearch = c.firstName.toLowerCase().includes(search) || c.instagram.toLowerCase().includes(search);
            const matchRel = !filterRel || c.relationType === filterRel;
            const matchLieu = !filterLieu || c.meetingPlace === filterLieu;
            const matchStat = !filterStat || c.discussionStatus === filterStat;
            return matchSearch && matchRel && matchLieu && matchStat;
        }).sort((a, b) => a.firstName.localeCompare(b.firstName, 'fr'));
    },

    saveContact(e) {
        e.preventDefault();
        
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
        
        const contact = {
            id: this.currentEditId || Date.now().toString(),
            firstName: document.getElementById('firstName').value,
            instagram,
            relationType: document.getElementById('relationType').value,
            meetingPlace: document.getElementById('meetingPlace').value,
            discussionStatus: document.getElementById('discussionStatus').value,
            profession: document.getElementById('profession').value,
            location: document.getElementById('location').value,
            age: document.getElementById('age').value,
            phone: document.getElementById('phone').value,
            interests: document.getElementById('interests').value,
            notes: document.getElementById('notes').value,
            dateAdded: this.currentEditId ? 
                app.dataStore.contacts.find(c => c.id === this.currentEditId).dateAdded : 
                new Date().toISOString()
        };

        if (this.currentEditId) {
            const idx = app.dataStore.contacts.findIndex(c => c.id === this.currentEditId);
            app.dataStore.contacts[idx] = contact;
        } else {
            app.dataStore.contacts.push(contact);
        }

        app.dataStore.save();
        this.render();
        app.closeAddModal();
        if (this.currentViewId) this.viewProfile(this.currentViewId);
    },

    openInstagramProfile(username) {
        const clean = username.replace('@', '');
        window.location.href = `instagram://user?username=${clean}`;
        setTimeout(() => window.open(`https://instagram.com/${clean}`, '_blank'), 500);
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
    }
};
