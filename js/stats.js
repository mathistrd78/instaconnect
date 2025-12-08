// stats.js - Graphiques et statistiques
const stats = {
    currentType: null, // Sera initialisé par renderTabs()

    // Générer dynamiquement les onglets en fonction des champs
    renderTabs() {
        console.log('🎯 stats.renderTabs called');
        const tabsContainer = document.querySelector('.stats-selector');
        if (!tabsContainer) {
            console.error('❌ stats-selector container not found!');
            return;
        }
        
        // Récupérer tous les champs filtrables (select, radio, checkbox)
        // SAUF gender car déjà affiché dans les stats globales en haut
        const allFields = app.getAllFields();
        const filterableFields = allFields.filter(field => 
            (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') &&
            field.id !== 'gender' // Exclure gender
        );
        
        console.log('📋 Filterable fields for stats:', filterableFields.length, filterableFields.map(f => f.label));
        
        // Créer un mapping pour les icônes par défaut
        const defaultIcons = {
            'gender': '👥',
            'relationType': '💕',
            'meetingPlace': '📍',
            'discussionStatus': '💬'
        };
        
        // Générer les onglets pour les champs filtrables
        const tabsHTML = filterableFields.map(field => {
            const icon = defaultIcons[field.id] || '📊'; // Icône par défaut si non défini
            return `
                <button class="stat-tab" data-type="${field.id}" data-field-id="${field.id}">
                    <span class="stat-tab-icon">${icon}</span>
                    <span>${field.label}</span>
                </button>
            `;
        }).join('');
        
        // Ajouter l'onglet "Par mois" (toujours présent)
        const monthTab = `
            <button class="stat-tab" data-type="mois" data-field-id="mois">
                <span class="stat-tab-icon">📅</span>
                <span>Mois</span>
            </button>
        `;
        
        // Ajouter l'onglet "Par pays" (toujours présent)
        const countryTab = `
            <button class="stat-tab" data-type="pays" data-field-id="pays">
                <span class="stat-tab-icon">🌍</span>
                <span>Pays</span>
            </button>
        `;
        
        tabsContainer.innerHTML = tabsHTML + monthTab + countryTab;
        
        // Ajouter les event listeners
        document.querySelectorAll('.stat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const type = tab.getAttribute('data-type');
                console.log('🔘 Stat tab clicked:', type);
                this.switchChart(type);
            });
        });
        
        // Activer le premier onglet par défaut
        const firstTab = tabsContainer.querySelector('.stat-tab');
        if (firstTab) {
            firstTab.classList.add('active');
            this.currentType = firstTab.getAttribute('data-type');
            console.log('✅ First tab activated:', this.currentType);
        }
        
        console.log('✅ stats.renderTabs completed');
    },

    render() {
        this.updateGlobalStats();
        // Rendre le chart seulement si currentType est valide
        if (this.currentType) {
            this.renderChart();
        }
    },

    updateGlobalStats() {
        const contacts = app.dataStore.contacts;
        const totalContacts = contacts.length;
        const maleCount = contacts.filter(c => c.gender === '👨 Homme' || c.gender === 'Homme').length;
        const femaleCount = contacts.filter(c => c.gender === '👩 Femme' || c.gender === 'Femme').length;

        document.getElementById('totalContactsStat').textContent = totalContacts;
        document.getElementById('totalMaleStat').textContent = maleCount;
        document.getElementById('totalFemaleStat').textContent = femaleCount;
    },

    switchChart(type) {
        this.currentType = type;
        
        // Update active tab
        document.querySelectorAll('.stat-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');
        
        this.renderChart();
    },

    renderChart() {
        let data = [];
        let title = '';

        if (this.currentType === 'mois') {
            // Cas spécial : par mois
            title = 'Répartition par mois d\'ajout';
            data = this.groupByMonth();
        } else if (this.currentType === 'pays') {
            // Cas spécial : par pays
            title = 'Répartition par pays';
            data = this.groupByCountry();
        } else {
            // Trouver le champ correspondant
            const allFields = [...app.defaultFields, ...app.customFields];
            const field = allFields.find(f => f.id === this.currentType);
            
            if (field) {
                title = `Répartition par ${field.label.toLowerCase()}`;
                
                if (field.type === 'select' || field.type === 'radio') {
                    // Champs avec options/tags
                    data = this.groupBy(field.id, field);
                } else if (field.type === 'checkbox') {
                    // Champs checkbox : Oui/Non
                    data = this.groupByCheckbox(field.id, field);
                } else if (field.id === 'gender') {
                    // Cas spécial pour le sexe (ancien système)
                    data = this.groupByGender();
                }
            } else {
                console.error('Field not found:', this.currentType);
                title = 'Champ introuvable';
                data = [];
            }
        }

        document.getElementById('chartTitle').textContent = title;
        this.drawPieChart(data);
        this.renderLegend(data);
    },

    groupByGender() {
        const contacts = app.dataStore.contacts;
        const maleCount = contacts.filter(c => c.gender === '👨 Homme' || c.gender === 'Homme').length;
        const femaleCount = contacts.filter(c => c.gender === '👩 Femme' || c.gender === 'Femme').length;
        const undefinedCount = contacts.filter(c => !c.gender || c.gender === '').length;

        const data = [];
        if (maleCount > 0) {
            data.push({ label: '👨 Homme', value: maleCount, color: '#4A90E2' });
        }
        if (femaleCount > 0) {
            data.push({ label: '👩 Femme', value: femaleCount, color: '#E91E63' });
        }
        if (undefinedCount > 0) {
            data.push({ label: 'Non défini', value: undefinedCount, color: '#868e96' });
        }

        return data;
    },

    groupBy(field) {
        const counts = {};
        app.dataStore.contacts.forEach(c => {
            const val = c[field] || 'Non défini';
            counts[val] = (counts[val] || 0) + 1;
        });
        return Object.entries(counts).map(([label, value]) => ({
            label,
            value,
            color: this.getColorForValue(field, label)
        }));
    },

    groupByMonth() {
        const months = {};
        app.dataStore.contacts.forEach(c => {
            const date = new Date(c.dateAdded);
            const key = date.toLocaleDateString('fr-FR', {year: 'numeric', month: 'long'});
            months[key] = (months[key] || 0) + 1;
        });
        const colors = ['#a29bfe', '#fd79a8', '#74b9ff', '#ff7675', '#55efc4', '#E1306C'];
        return Object.entries(months).slice(-6).map(([label, value], i) => ({
            label, value, color: colors[i % colors.length]
        }));
    },

    groupByCountry() {
        if (typeof city === 'undefined') return [];
        
        const countryStats = city.getCountryStats(app.dataStore.contacts);
        const colors = ['#a29bfe', '#fd79a8', '#74b9ff', '#ff7675', '#55efc4', '#E1306C', '#feca57', '#00b894', '#0984e3', '#6c5ce7'];
        
        return countryStats.map((stat, i) => ({
            label: `${stat.flag} ${stat.country}`,
            value: stat.count,
            color: stat.country === 'Non défini' ? '#868e96' : colors[i % colors.length]
        }));
    },

    groupByCheckbox(field, fieldObj) {
        const counts = { 'Oui': 0, 'Non': 0 };
        app.dataStore.contacts.forEach(c => {
            const val = c[field];
            if (val === true || val === 'true') {
                counts['Oui']++;
            } else {
                counts['Non']++;
            }
        });
        return [
            { label: '✅ Oui', value: counts['Oui'], color: '#00b894' },
            { label: '❌ Non', value: counts['Non'], color: '#d63031' }
        ];
    },

    getColorForValue(field, value) {
        const tag = tags.findTag(field, value);
        if (tag) {
            const el = document.createElement('div');
            el.className = tag.class;
            document.body.appendChild(el);
            const color = getComputedStyle(el).backgroundColor;
            document.body.removeChild(el);
            return this.rgbToHex(color);
        }
        
        // Couleurs par défaut pour les options sans tags
        const defaultColors = {
            'Oui': '#00b894',
            'Non': '#d63031',
            'Oui ✅': '#00b894',
            'Non ❌': '#d63031',
            'Non défini': '#868e96'
        };
        
        // Si c'est une valeur connue, utiliser la couleur par défaut
        if (defaultColors[value]) {
            return defaultColors[value];
        }
        
        // Sinon, générer une couleur aléatoire mais stable (basée sur le hash du texte)
        const colors = ['#a29bfe', '#fd79a8', '#74b9ff', '#ff7675', '#55efc4', '#E1306C', '#feca57', '#00b894', '#0984e3', '#6c5ce7'];
        const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    },

    rgbToHex(rgb) {
        const match = rgb.match(/\d+/g);
        if (!match) return '#868e96';
        return '#' + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    },

    drawPieChart(data) {
        const svg = document.getElementById('chartSvg');
        const total = data.reduce((sum, d) => sum + d.value, 0);
        if (total === 0) {
            svg.innerHTML = '<text x="150" y="150" text-anchor="middle" fill="#868e96" font-size="16">Aucune donnée</text>';
            return;
        }

        // Special case: single slice = full circle
        if (data.length === 1) {
            svg.innerHTML = `<circle cx="150" cy="150" r="120" fill="${data[0].color}" stroke="white" stroke-width="2"/>`;
            return;
        }

        let currentAngle = -90;
        const cx = 150, cy = 150, r = 120;

        const paths = data.map(d => {
            const angle = (d.value / total) * 360;
            
            // If this slice is almost the full circle (>359°), draw it as a circle
            if (angle >= 359.9) {
                return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${d.color}" stroke="white" stroke-width="2"/>`;
            }
            
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = cx + r * Math.cos(startAngle * Math.PI / 180);
            const y1 = cy + r * Math.sin(startAngle * Math.PI / 180);
            const x2 = cx + r * Math.cos(endAngle * Math.PI / 180);
            const y2 = cy + r * Math.sin(endAngle * Math.PI / 180);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
            
            currentAngle = endAngle;
            return `<path d="${path}" fill="${d.color}" stroke="white" stroke-width="2"/>`;
        }).join('');

        svg.innerHTML = paths;
    },

    renderLegend(data) {
        // Trier par quantité (du plus récurrent au moins récurrent)
        const sortedData = [...data].sort((a, b) => {
            return b.value - a.value; // Du plus grand au plus petit
        });
        
        const total = sortedData.reduce((sum, d) => sum + d.value, 0);
        const html = sortedData.map(d => {
            const percent = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return `
                <div class="legend-item">
                    <div class="legend-label">
                        <div class="legend-color" style="background: ${d.color};"></div>
                        <span>${d.label}</span>
                    </div>
                    <div>
                        <span class="legend-value">${d.value}</span>
                        <span class="legend-percent">(${percent}%)</span>
                    </div>
                </div>
            `;
        }).join('');
        document.getElementById('chartLegend').innerHTML = html;
    }
};

// Exposer stats globalement
window.stats = stats;
