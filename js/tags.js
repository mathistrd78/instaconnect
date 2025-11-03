// ================================
// TAGS.JS - Gestion des tags
// ================================

const tags = {
    // Configuration des emojis et couleurs disponibles
    availableEmojis: [
        '👥', '👨‍👩‍👧', '🤝', '❤️', '🌍', '📸', '🔥', '💜', '🎵', '💬', '🤐', '👀', '📝', 
        '🏷️', '✨', '⭐', '🎯', '🎨', '🎭', '🎪', '🎬', '🎮', '🎲', '🎰', '🏆', '🏅',
        '⚽', '🏀', '🎾', '🎳', '🏊', '🚴', '🏋️', '🤸', '🧘', '💃', '🕺', '🎤', '🎧',
        '🎼', '🎹', '🎸', '🎺', '🎷', '🥁', '📚', '📖', '✍️', '💼', '🎓', '🏫', '🏢',
        '🏦', '🏪', '🏨', '✈️', '🚗', '🏠', '🍕', '🍔', '🍰', '☕', '🍷', '🎂', '💐',
        '🌹', '🌺', '🌸', '🌼', '🌻', '🦋', '🐶', '🐱', '🦁', '🐯', '🦊', '🐻', '😀',
        '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰',
        '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝',
        '🤑', '🤗', '🤭', '🤫', '🤔', '💪', '👋', '🤚', '🖐', '✋', '👌', '✌️', '🤞',
        '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '👏', '🙌'
    ],

    availableColors: [
        '#a29bfe', '#fd79a8', '#74b9ff', '#ff7675', '#55efc4', '#E1306C',
        '#ff6348', '#a55eea', '#feca57', '#00b894', '#dfe6e9', '#fdcb6e',
        '#0984e3', '#6c5ce7', '#00cec9', '#e17055', '#d63031', '#00b894',
        '#00cec9', '#0984e3', '#6c5ce7', '#b2bec3', '#636e72', '#2d3436'
    ],

    // État actuel de l'édition
    currentEdit: null,
    currentContext: null,

    // Récupérer tous les tags pour un type donné
    getAllOptions(type) {
        return [...app.defaultTags[type], ...app.customTags[type]];
    },

    // Trouver un tag par valeur
    findTag(type, value) {
        return this.getAllOptions(type).find(opt => opt.value === value);
    },

    // Afficher le dropdown de sélection de tags
    showDropdown(event, contactId, fieldType) {
        event.stopPropagation();
        this.currentContext = { contactId, fieldType };
        const allOptions = this.getAllOptions(fieldType);
        
        this.renderOptions(allOptions);
        
        document.getElementById('overlay').classList.add('active');
        document.getElementById('tagDropdown').classList.add('active');
        
        const searchInput = document.getElementById('tagSearchInput');
        searchInput.value = '';
        // Don't auto-focus to prevent keyboard popup on mobile
        
        searchInput.oninput = () => {
            const filtered = allOptions.filter(opt => 
                opt.label.toLowerCase().includes(searchInput.value.toLowerCase())
            );
            this.renderOptions(filtered, searchInput.value);
        };
    },

    // Rendre les options de tags
    renderOptions(options, searchValue = '') {
        const list = document.getElementById('tagOptionsList');
        
        let html = options.map(opt => `
            <div class="tag-option">
                <div onclick="tags.selectTag('${opt.value.replace(/'/g, "\\'")}')">
                    <span class="tag-option-preview ${opt.class}">${opt.label}</span>
                </div>
                <span class="tag-edit-btn" onclick="event.stopPropagation(); tags.openEditModal('${this.currentContext.fieldType}', '${opt.value.replace(/'/g, "\\'")}')">✏️</span>
            </div>
        `).join('');
        
        if (searchValue && !options.find(opt => opt.value.toLowerCase() === searchValue.toLowerCase())) {
            html += `
                <div class="tag-create" onclick="tags.createAndSelect('${searchValue.replace(/'/g, "\\'")}')">
                    <span class="tag-create-icon">+</span>
                    Créer "${searchValue}"
                </div>
            `;
        }
        
        list.innerHTML = html;
    },

    // Sélectionner un tag
    selectTag(value) {
        if (!this.currentContext) return;
        
        // Check if it's a form context
        if (this.currentContext.contactId === 'form') {
            contacts.selectFormTag(value);
            return;
        }
        
        const contact = app.dataStore.contacts.find(c => c.id === this.currentContext.contactId);
        if (contact) {
            contact[this.currentContext.fieldType] = value;
            app.dataStore.save();
            contacts.render();
        }
        
        this.closeDropdown();
    },

    // Créer et sélectionner un nouveau tag
    createAndSelect(value) {
        if (!this.currentContext) return;
        this.addCustomTag(this.currentContext.fieldType, value);
        this.selectTag(value);
    },

    // Ajouter un tag personnalisé
    addCustomTag(type, value) {
        const color = this.availableColors[Math.floor(Math.random() * this.availableColors.length)];
        const className = 'tag-custom-' + Date.now();
        const newTag = {
            value: value,
            label: '🏷️ ' + value,
            class: className
        };
        app.customTags[type].push(newTag);
        
        const style = document.createElement('style');
        style.textContent = `.${className} { background: ${color}; color: white; }`;
        document.head.appendChild(style);
        
        app.dataStore.save();
        return newTag;
    },

    // Fermer le dropdown
    closeDropdown() {
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('tagDropdown').classList.remove('active');
        this.currentContext = null;
    },

    // Ouvrir la modale d'édition
    openEditModal(fieldType, value) {
        this.closeDropdown();
        
        let tag = app.customTags[fieldType].find(t => t.value === value);
        let isDefault = false;
        
        if (!tag) {
            tag = app.defaultTags[fieldType].find(t => t.value === value);
            isDefault = true;
        }
        
        if (!tag) return;
        
        this.currentEdit = { fieldType, value, tag, isDefault };
        
        // Rendre les emojis
        const emojiPicker = document.getElementById('emojiPicker');
        const currentEmoji = tag.label.split(' ')[0];
        emojiPicker.innerHTML = this.availableEmojis.map(emoji => `
            <div class="emoji-option ${currentEmoji === emoji ? 'selected' : ''}" 
                 onclick="tags.selectEmoji('${emoji}')">${emoji}</div>
        `).join('');
        
        // Rendre les couleurs
        const colorPicker = document.getElementById('colorPicker');
        colorPicker.innerHTML = this.availableColors.map(color => `
            <div class="color-option" 
                 style="background: ${color};"
                 onclick="tags.selectColor('${color}')"></div>
        `).join('');
        
        this.updatePreview();
        
        document.getElementById('overlay').classList.add('active');
        document.getElementById('tagEditModal').classList.add('active');
    },

    // Sélectionner un emoji
    selectEmoji(emoji) {
        if (!this.currentEdit) return;
        
        const tagName = this.currentEdit.tag.label.replace(/^.+?\s/, '');
        this.currentEdit.tag.label = emoji + ' ' + tagName;
        
        document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
        
        this.updatePreview();
    },

    // Sélectionner une couleur
    selectColor(color) {
        if (!this.currentEdit) return;
        
        this.currentEdit.selectedColor = color;
        
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
        
        this.updatePreview();
    },

    // Mettre à jour l'aperçu
    updatePreview() {
        if (!this.currentEdit) return;
        
        const preview = document.getElementById('tagPreview');
        preview.textContent = this.currentEdit.tag.label;
        preview.style.background = this.currentEdit.selectedColor || '#868e96';
        preview.style.color = 'white';
    },

    // Sauvegarder l'édition
    saveEdit() {
        if (!this.currentEdit) return;
        
        const { fieldType, value, tag, isDefault } = this.currentEdit;
        const newColor = this.currentEdit.selectedColor || '#868e96';
        
        if (isDefault) {
            const className = 'tag-custom-' + Date.now();
            const newTag = {
                value: tag.value,
                label: tag.label,
                class: className
            };
            
            const existingIndex = app.customTags[fieldType].findIndex(t => t.value === value);
            if (existingIndex >= 0) {
                app.customTags[fieldType][existingIndex] = newTag;
            } else {
                app.customTags[fieldType].push(newTag);
            }
            
            const style = document.createElement('style');
            style.id = 'style-' + className;
            style.textContent = `.${className} { background: ${newColor}; color: white; }`;
            document.head.appendChild(style);
        } else {
            const styleId = 'style-' + tag.class;
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            styleElement.textContent = `.${tag.class} { background: ${newColor}; color: white; }`;
        }
        
        app.dataStore.save();
        contacts.render();
        this.closeEditModal();
    },

    // Supprimer un tag
    deleteTag() {
        if (!this.currentEdit) return;
        
        const { fieldType, value, isDefault } = this.currentEdit;
        
        if (isDefault) {
            alert('Impossible de supprimer un tag par défaut.');
            return;
        }
        
        if (!confirm('Supprimer ce tag ?')) return;
        
        app.customTags[fieldType] = app.customTags[fieldType].filter(t => t.value !== value);
        
        app.dataStore.contacts.forEach(contact => {
            if (contact[fieldType] === value) {
                contact[fieldType] = '';
            }
        });
        
        app.dataStore.save();
        contacts.render();
        this.closeEditModal();
    },

    // Fermer la modale d'édition
    closeEditModal() {
        document.getElementById('overlay').classList.remove('active');
        document.getElementById('tagEditModal').classList.remove('active');
        this.currentEdit = null;
    }
};
