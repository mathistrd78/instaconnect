// stats.js - Graphiques et statistiques
const stats = {
    currentType: 'sexe',

    render() {
        this.updateGlobalStats();
        this.renderChart();
    },

    updateGlobalStats() {
        const contacts = app.dataStore.contacts;
        const totalContacts = contacts.length;
        const maleCount = contacts.filter(c => c.gender === 'Homme').length;
        const femaleCount = contacts.filter(c => c.gender === 'Femme').length;

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

        switch(this.currentType) {
            case 'sexe':
                title = 'Répartition par sexe';
                data = this.groupByGender();
                break;
            case 'relation':
                title = 'Répartition par type de relation';
                data = this.groupBy('relationType');
                break;
            case 'lieu':
                title = 'Répartition par lieu de rencontre';
                data = this.groupBy('meetingPlace');
                break;
            case 'statut':
                title = 'Répartition par statut de discussion';
                data = this.groupBy('discussionStatus');
                break;
            case 'mois':
                title = 'Répartition par mois d\'ajout';
                data = this.groupByMonth();
                break;
        }

        document.getElementById('chartTitle').textContent = title;
        this.drawPieChart(data);
        this.renderLegend(data);
    },

    groupByGender() {
        const contacts = app.dataStore.contacts;
        const maleCount = contacts.filter(c => c.gender === 'Homme').length;
        const femaleCount = contacts.filter(c => c.gender === 'Femme').length;
        const undefinedCount = contacts.filter(c => !c.gender || c.gender === '').length;

        const data = [];
        if (maleCount > 0) {
            data.push({ label: 'Homme', value: maleCount, color: '#4A90E2' });
        }
        if (femaleCount > 0) {
            data.push({ label: 'Femme', value: femaleCount, color: '#E91E63' });
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
        return '#868e96';
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
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const html = data.map(d => {
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
