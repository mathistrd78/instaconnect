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
        // Merge defaults and customs, with customs overriding defaults with same value
        const defaults = app.defaultTags[type];
        const customs = app.customTags[type];
        
        // Get values that have custom overrides
        const customValues = new Set(customs.map(t => t.value));
        
        // Filter out defaults that have been customized
        const filteredDefaults = defaults.filter(t => !customValues.has(t.value));
        
        // Return filtered defaults + all customs
        return [...filteredDefaults, ...customs];
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
        
        // Show overlay and modal - overlay BEHIND modal
        document.getElementById('overlay').classList.add('active');
        document.getElementById('tagEditModal').classList.add('active');
    },

    // Sélectionner un emoji
    selectEmoji(emoji) {
        if (!this.currentEdit) return;
        
        const tagName = this.currentEdit.tag.label.replace(/^.+?\s/, '');
        this.currentEdit.tag.label = emoji + ' ' + tagName;
        
        document.querySelectorAll('.emoji-option').forEach(el => el.classList.remove('selected'));
        
        // Find and select the clicked emoji
        const emojiOptions = document.querySelectorAll('.emoji-option');
        emojiOptions.forEach(el => {
            if (el.textContent === emoji) {
                el.classList.add('selected');
            }
        });
        
        this.updatePreview();
    },

    // Sélectionner une couleur
    selectColor(color) {
        if (!this.currentEdit) return;
        
        this.currentEdit.selectedColor = color;
        
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.remove('selected');
            // Check if this element has the selected color
            const bgColor = el.style.background || el.style.backgroundColor;
            if (bgColor === color || this.normalizeColor(bgColor) === this.normalizeColor(color)) {
                el.classList.add('selected');
            }
        });
        
        this.updatePreview();
    },

    normalizeColor(color) {
        // Convert rgb/rgba to hex if needed
        if (!color) return '';
        return color.toLowerCase().replace(/\s/g, '');
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
        
        const { fieldType, value, tag } = this.currentEdit;
        const newColor = this.currentEdit.selectedColor || '#868e96';
        
        console.log('💾 Saving tag edit:', { fieldType, value, label: tag.label, color: newColor });
        
        // Find existing custom tag
        const existingIndex = app.customTags[fieldType].findIndex(t => t.value === value);
        
        let className;
        
        if (existingIndex >= 0) {
            // Custom tag already exists → update it (KEEP THE SAME CLASS!)
            console.log('✏️ Updating existing custom tag at index:', existingIndex);
            
            className = app.customTags[fieldType][existingIndex].class;
            app.customTags[fieldType][existingIndex].label = tag.label;
            
            console.log('📝 Keeping same class:', className);
        } else {
            // New custom tag (first time editing)
            console.log('➕ Creating new custom tag');
            
            className = 'tag-custom-' + Date.now();
            const newTag = {
                value: value,
                label: tag.label,
                class: className
            };
            
            app.customTags[fieldType].push(newTag);
            console.log('🆕 New class created:', className);
        }
        
        // Update or create style for this class
        const styleId = 'style-' + className;
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = `.${className} { background: ${newColor}; color: white; }`;
        
        console.log('💾 Custom tags after save:', app.customTags[fieldType]);
        
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
        document.getElementById('tagEditModal').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
        this.currentEdit = null;
    }
};
