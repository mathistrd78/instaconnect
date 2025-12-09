// fields.js - Gestion des champs personnalisés
const fields = {
    currentEditField: null,
    draggedFieldId: null,

    // Types de champs disponibles
    fieldTypes: [
        { value: 'text', label: '📝 Texte libre', icon: '📝' },
        { value: 'textarea', label: '📄 Texte long', icon: '📄' },
        { value: 'number', label: '🔢 Nombre', icon: '🔢' },
        { value: 'select', label: '🏷️ Sélection (avec tags)', icon: '🏷️' },
        { value: 'radio', label: '⚪ Choix unique', icon: '⚪' },
        { value: 'checkbox', label: '☑️ Case à cocher', icon: '☑️' },
        { value: 'date', label: '📅 Date', icon: '📅' },
        { value: 'tel', label: '📞 Téléphone', icon: '📞' },
        { value: 'email', label: '📧 Email', icon: '📧' },
        { value: 'url', label: '🔗 URL', icon: '🔗' }
    ],

    // Ouvrir la modal d'ajout de champ
    openAddFieldModal() {
        const modal = document.getElementById('addFieldModal');
        if (!modal) {
            this.createAddFieldModal();
        }
        
        // Reset form
        document.getElementById('newFieldType').value = 'text';
        document.getElementById('newFieldLabel').value = '';
        document.getElementById('newFieldRequired').checked = false;
        
        // Hide options for non-select/radio fields
        document.getElementById('fieldOptionsSection').style.display = 'none';
        
        document.getElementById('addFieldModal').classList.add('active');
    },

    // Créer la modal d'ajout de champ dans le DOM
    createAddFieldModal() {
        const modalHTML = `
            <div id="addFieldModal" class="modal">
                <div class="modal-header">
                    <h2>➕ Ajouter un champ</h2>
                    <button class="close-btn" onclick="fields.closeAddFieldModal()">✕</button>
                </div>
                <div class="modal-content">
                    <form id="addFieldForm" onsubmit="fields.saveNewField(event)">
                        <div class="form-group">
                            <label>Type de champ <span style="color: #ff4757;">*</span></label>
                            <select id="newFieldType" required onchange="fields.onFieldTypeChange()">
                                ${this.fieldTypes.map(type => `
                                    <option value="${type.value}">${type.label}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Nom du champ <span style="color: #ff4757;">*</span></label>
                            <input type="text" id="newFieldLabel" required>
                        </div>
                        
                        <div class="form-group" id="fieldOptionsSection" style="display: none;">
                            <label>Options (pour select/radio) <span style="color: #ff4757;">*</span></label>
                            <textarea id="newFieldOptions" placeholder="Entrez les options, une par ligne&#10;Exemple:&#10;Option 1&#10;Option 2&#10;Option 3" rows="4"></textarea>
                            <div style="font-size: 12px; color: #868e96; margin-top: 4px;">
                                💡 Pour les champs de type "Sélection", vous pourrez créer des tags avec emojis et couleurs après création
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="newFieldRequired" style="width: 18px; height: 18px; cursor: pointer;">
                                <span>Champ obligatoire</span>
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">✅ Créer le champ</button>
                            <button type="button" class="btn" onclick="fields.closeAddFieldModal()">Annuler</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Gérer le changement de type de champ
    onFieldTypeChange() {
        const type = document.getElementById('newFieldType').value;
        const optionsSection = document.getElementById('fieldOptionsSection');
        
        // Afficher les options seulement pour select et radio
        if (type === 'select' || type === 'radio') {
            optionsSection.style.display = 'block';
        } else {
            optionsSection.style.display = 'none';
        }
    },

    // Fermer la modal
    closeAddFieldModal() {
        document.getElementById('addFieldModal').classList.remove('active');
    },

    // Sauvegarder le nouveau champ
    saveNewField(event) {
        event.preventDefault();
        
        const type = document.getElementById('newFieldType').value;
        const label = document.getElementById('newFieldLabel').value.trim();
        const required = document.getElementById('newFieldRequired').checked;
        
        if (!label) {
            alert('Veuillez entrer un nom pour le champ');
            return;
        }
        
        const fieldData = {
            type,
            label,
            required
        };
        
        // Pour select et radio, récupérer les options
        if (type === 'select' || type === 'radio') {
            const optionsText = document.getElementById('newFieldOptions').value.trim();
            if (!optionsText && type === 'radio') {
                alert('Veuillez entrer au moins 2 options pour un champ à choix unique');
                return;
            }
            
            if (type === 'radio') {
                fieldData.options = optionsText.split('\n').map(o => o.trim()).filter(o => o);
                if (fieldData.options.length < 2) {
                    alert('Un champ à choix unique nécessite au moins 2 options');
                    return;
                }
            }
        }
        
        // Ajouter le champ
        app.addCustomField(fieldData);
        
        // Fermer la modal
        this.closeAddFieldModal();
        
        // Sauvegarder l'ID du contact en cours d'édition
        const currentEditId = contacts.currentEditId;
        
        // Re-render le formulaire de contact
        contacts.renderDynamicForm();
        
        // Si on était en train d'éditer un contact, recharger ses données
        if (currentEditId) {
            const contact = app.dataStore.contacts.find(c => c.id === currentEditId);
            if (contact) {
                console.log('🔄 Restoring contact edit context...');
                
                // Remplir tous les champs avec les données du contact
                document.getElementById('firstName').value = contact.firstName || '';
                document.getElementById('instagram').value = (contact.instagram || '').replace('@', '');
                
                // Remplir dynamiquement tous les autres champs
                const allFields = app.getAllFields();
                allFields.forEach(field => {
                    const element = document.getElementById(field.id);
                    if (!element) return;
                    
                    const value = contact[field.id];
                    
                    switch (field.type) {
                        case 'select':
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
                            }
                            break;
                            
                        case 'radio':
                            if (value) {
                                const radio = document.querySelector(`input[name="${field.id}"][value="${value}"]`);
                                if (radio) radio.checked = true;
                            }
                            break;
                            
                        case 'checkbox':
                            element.checked = !!value;
                            break;
                            
                        default:
                            element.value = value || '';
                    }
                });
                
                // Maintenir le titre de la modale
                document.getElementById('modalTitle').textContent = '✏️ Modifier le contact';
            }
        }
        
        // Régénérer les filtres et onglets stats si le nouveau champ est filtrable
        const lastAddedField = app.customFields[app.customFields.length - 1];
        if (lastAddedField && (lastAddedField.type === 'select' || lastAddedField.type === 'radio' || lastAddedField.type === 'checkbox')) {
            contacts.renderFilters();
            stats.renderTabs();
        }
        
        alert(`✅ Champ "${label}" créé avec succès !`);
    },

    // Ouvrir la modal de gestion des champs
    openManageFieldsModal() {
        const modal = document.getElementById('manageFieldsModal');
        if (!modal) {
            this.createManageFieldsModal();
        }
        
        this.renderFieldsList();
        document.getElementById('manageFieldsModal').classList.add('active');
    },

    // Créer la modal de gestion des champs
    createManageFieldsModal() {
        const modalHTML = `
            <div id="manageFieldsModal" class="modal">
                <div class="modal-header">
                    <h2>⚙️ Gérer les champs</h2>
                    <button class="close-btn" onclick="fields.closeManageFieldsModal()">✕</button>
                </div>
                <div class="modal-content">
                    <div style="margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px; font-size: 13px; color: #495057;">
                        💡 Glissez-déposez les champs pour les réordonner
                    </div>
                    <div id="fieldsList"></div>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-primary" onclick="fields.closeManageFieldsModal()">✅ Terminé</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Afficher la liste des champs
    renderFieldsList() {
        const list = document.getElementById('fieldsList');
        const allFields = app.getAllFields();
        
        const html = allFields.map((field, index) => {
            const isDefault = app.defaultFields.some(f => f.id === field.id);
            const typeInfo = this.fieldTypes.find(t => t.value === field.type);
            const icon = typeInfo ? typeInfo.icon : '📝';
            
            return `
                <div class="field-item ${isDefault ? 'field-default' : 'field-custom'}" 
                     data-field-id="${field.id}" 
                     data-index="${index}">
                    <div class="field-item-handle" data-field-id="${field.id}">☰</div>
                    <div class="field-item-info">
                        <div class="field-item-label">
                            ${icon} ${field.label} ${field.required ? '<span style="color: #ff4757;">*</span>' : ''}
                        </div>
                        <div class="field-item-meta">
                            ${field.type} ${isDefault ? '• Par défaut' : '• Personnalisé'}
                        </div>
                    </div>
                    ${!isDefault ? `
                        <button class="field-item-delete" onclick="fields.deleteField('${field.id}')" title="Supprimer">
                            🗑️
                        </button>
                    ` : `
                        <div style="width: 32px;"></div>
                    `}
                </div>
            `;
        }).join('');
        
        list.innerHTML = html;
        
        // Attacher les événements tactiles
        this.attachDragEvents();
    },

    // Variables pour le drag tactile
    dragState: {
        isDragging: false,
        draggedElement: null,
        draggedId: null,
        placeholder: null,
        startY: 0,
        currentY: 0,
        offsetY: 0
    },

    // Attacher les événements de drag (desktop ET mobile)
    attachDragEvents() {
        const handles = document.querySelectorAll('.field-item-handle');
        
        handles.forEach(handle => {
            // Desktop - Mouse events
            handle.addEventListener('mousedown', (e) => this.startDrag(e, false));
            
            // Mobile - Touch events
            handle.addEventListener('touchstart', (e) => this.startDrag(e, true), { passive: false });
        });
        
        // Global listeners
        document.addEventListener('mousemove', (e) => this.onDragMove(e, false));
        document.addEventListener('touchmove', (e) => this.onDragMove(e, true), { passive: false });
        
        document.addEventListener('mouseup', (e) => this.endDrag(e, false));
        document.addEventListener('touchend', (e) => this.endDrag(e, true));
    },

    startDrag(e, isTouch) {
        e.preventDefault();
        
        const fieldId = e.target.dataset.fieldId;
        if (!fieldId) return;
        
        const fieldItem = e.target.closest('.field-item');
        if (!fieldItem) return;
        
        this.dragState.isDragging = true;
        this.dragState.draggedElement = fieldItem;
        this.dragState.draggedId = fieldId;
        
        // Position initiale
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        this.dragState.startY = clientY;
        this.dragState.currentY = clientY;
        
        const rect = fieldItem.getBoundingClientRect();
        this.dragState.offsetY = clientY - rect.top;
        
        // Créer le placeholder
        const placeholder = fieldItem.cloneNode(true);
        placeholder.classList.add('field-item-placeholder');
        placeholder.style.opacity = '0.4';
        this.dragState.placeholder = placeholder;
        
        // Style de l'élément draggé
        fieldItem.classList.add('field-item-dragging');
        fieldItem.style.position = 'fixed';
        fieldItem.style.zIndex = '9999';
        fieldItem.style.width = rect.width + 'px';
        fieldItem.style.left = rect.left + 'px';
        fieldItem.style.top = rect.top + 'px';
        fieldItem.style.pointerEvents = 'none';
        
        // Insérer le placeholder
        fieldItem.parentNode.insertBefore(placeholder, fieldItem.nextSibling);
    },

    onDragMove(e, isTouch) {
        if (!this.dragState.isDragging) return;
        
        e.preventDefault();
        
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        this.dragState.currentY = clientY;
        
        // Déplacer l'élément
        const newTop = clientY - this.dragState.offsetY;
        this.dragState.draggedElement.style.top = newTop + 'px';
        
        // Trouver l'élément sous le curseur
        const list = document.getElementById('fieldsList');
        const items = Array.from(list.querySelectorAll('.field-item:not(.field-item-dragging):not(.field-item-placeholder)'));
        
        let targetItem = null;
        let insertBefore = false;
        
        for (const item of items) {
            const rect = item.getBoundingClientRect();
            const middle = rect.top + rect.height / 2;
            
            if (clientY < middle) {
                targetItem = item;
                insertBefore = true;
                break;
            } else if (clientY < rect.bottom) {
                targetItem = item;
                insertBefore = false;
                break;
            }
        }
        
        // Déplacer le placeholder
        if (targetItem) {
            if (insertBefore) {
                list.insertBefore(this.dragState.placeholder, targetItem);
            } else {
                list.insertBefore(this.dragState.placeholder, targetItem.nextSibling);
            }
        }
    },

    endDrag(e, isTouch) {
        if (!this.dragState.isDragging) return;
        
        e.preventDefault();
        
        const draggedElement = this.dragState.draggedElement;
        const placeholder = this.dragState.placeholder;
        
        // Calculer le nouvel ordre
        const list = document.getElementById('fieldsList');
        const allItems = Array.from(list.querySelectorAll('.field-item'));
        const newIndex = allItems.indexOf(placeholder);
        
        // Réinitialiser les styles
        draggedElement.classList.remove('field-item-dragging');
        draggedElement.style.position = '';
        draggedElement.style.zIndex = '';
        draggedElement.style.width = '';
        draggedElement.style.left = '';
        draggedElement.style.top = '';
        draggedElement.style.pointerEvents = '';
        
        // Remplacer le placeholder par l'élément original
        if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.replaceChild(draggedElement, placeholder);
        }
        
        // Sauvegarder le nouvel ordre
        this.saveFieldOrder();
        
        // Reset state
        this.dragState.isDragging = false;
        this.dragState.draggedElement = null;
        this.dragState.draggedId = null;
        this.dragState.placeholder = null;
    },

    // Sauvegarder l'ordre des champs
    saveFieldOrder() {
        const list = document.getElementById('fieldsList');
        const items = Array.from(list.querySelectorAll('.field-item'));
        
        // Mettre à jour l'ordre de tous les champs
        items.forEach((item, index) => {
            const fieldId = item.dataset.fieldId;
            const allFields = [...app.defaultFields, ...app.customFields];
            const field = allFields.find(f => f.id === fieldId);
            if (field) {
                field.order = index;
            }
        });
        
        // Sauvegarder dans Firebase
        app.dataStore.saveMetadata(); // Optimisé: sauvegarde seulement les métadonnées
        
        console.log('✅ Ordre des champs sauvegardé');
    },

    // Anciennes fonctions drag & drop (gardées pour compatibilité mais non utilisées)
    onDragStart(event, fieldId) {},
    onDragOver(event) {},
    onDrop(event, targetFieldId) {},
    onDragEnd(event) {},

    // Supprimer un champ personnalisé
    deleteField(fieldId) {
        const field = app.customFields.find(f => f.id === fieldId);
        if (!field) return;
        
        if (!confirm(`Supprimer le champ "${field.label}" ?\n\nAttention : toutes les données de ce champ seront supprimées de tous les contacts.`)) {
            return;
        }
        
        app.deleteCustomField(fieldId);
        this.renderFieldsList();
        contacts.renderDynamicForm();
        
        alert(`✅ Champ "${field.label}" supprimé`);
    },

    // Fermer la modal de gestion
    closeManageFieldsModal() {
        document.getElementById('manageFieldsModal').classList.remove('active');
    }
};

// Exposer fields globalement
window.fields = fields;
