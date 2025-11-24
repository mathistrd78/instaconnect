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
        document.getElementById('newFieldPlaceholder').value = '';
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
                            <input type="text" id="newFieldLabel" required placeholder="Ex: Ville de naissance">
                        </div>
                        
                        <div class="form-group">
                            <label>Placeholder (optionnel)</label>
                            <input type="text" id="newFieldPlaceholder" placeholder="Ex: Paris">
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
        const placeholder = document.getElementById('newFieldPlaceholder').value.trim();
        const required = document.getElementById('newFieldRequired').checked;
        
        if (!label) {
            alert('Veuillez entrer un nom pour le champ');
            return;
        }
        
        const fieldData = {
            type,
            label,
            placeholder,
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
        
        // Re-render le formulaire de contact
        contacts.renderDynamicForm();
        
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
                     draggable="true"
                     ondragstart="fields.onDragStart(event, '${field.id}')"
                     ondragover="fields.onDragOver(event)"
                     ondrop="fields.onDrop(event, '${field.id}')"
                     ondragend="fields.onDragEnd(event)">
                    <div class="field-item-handle">☰</div>
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
    },

    // Drag & Drop handlers
    onDragStart(event, fieldId) {
        this.draggedFieldId = fieldId;
        event.currentTarget.style.opacity = '0.5';
    },

    onDragOver(event) {
        event.preventDefault();
        event.currentTarget.style.borderTop = '2px solid #E1306C';
    },

    onDrop(event, targetFieldId) {
        event.preventDefault();
        event.currentTarget.style.borderTop = '';
        
        if (this.draggedFieldId === targetFieldId) return;
        
        // Réordonner les champs
        const allFields = app.getAllFields();
        const draggedIndex = allFields.findIndex(f => f.id === this.draggedFieldId);
        const targetIndex = allFields.findIndex(f => f.id === targetFieldId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Mettre à jour les ordres
        const draggedField = allFields[draggedIndex];
        draggedField.order = targetIndex;
        
        // Réajuster tous les ordres
        allFields.forEach((field, index) => {
            if (field.id === this.draggedFieldId) return;
            
            if (draggedIndex < targetIndex) {
                // Déplacé vers le bas
                if (index > draggedIndex && index <= targetIndex) {
                    field.order = index - 1;
                }
            } else {
                // Déplacé vers le haut
                if (index >= targetIndex && index < draggedIndex) {
                    field.order = index + 1;
                }
            }
        });
        
        // Sauvegarder
        app.dataStore.save();
        
        // Re-render
        this.renderFieldsList();
    },

    onDragEnd(event) {
        event.currentTarget.style.opacity = '1';
        event.currentTarget.style.borderTop = '';
        this.draggedFieldId = null;
    },

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
