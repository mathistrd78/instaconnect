// stats.js - Graphiques et statistiques
const stats = {
    render() {
        this.updateCards();
        this.renderChart();
    },

    updateCards() {
        const contacts = app.dataStore.contacts;
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        document.getElementById('statTotal').textContent = contacts.length;
        document.getElementById('statWeek').textContent = contacts.filter(c => 
            new Date(c.dateAdded) > weekAgo
        ).length;
        document.getElementById('statMonth').textContent = contacts.filter(c => 
            new Date(c.dateAdded) > monthAgo
        ).length;
        document.getElementById('statFavorites').textContent = contacts.filter(c => 
            c.relationType === 'Ami' || c.relationType === 'Amour' || c.relationType === 'Sexe'
        ).length;
    },

    renderChart() {
        const type = document.getElementById('statsType').value;
        let data = [];
        let title = '';

        switch(type) {
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
            case 'age':
                title = 'Répartition par tranche d\'âge';
                data = this.groupByAge();
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

    groupByAge() {
        const ranges = {'18-24': 0, '25-29': 0, '30-34': 0, '35-39': 0, '40+': 0, 'Non défini': 0};
        app.dataStore.contacts.forEach(c => {
            if (!c.age) ranges['Non défini']++;
            else if (c.age < 25) ranges['18-24']++;
            else if (c.age < 30) ranges['25-29']++;
            else if (c.age < 35) ranges['30-34']++;
            else if (c.age < 40) ranges['35-39']++;
            else ranges['40+']++;
        });
        const colors = ['#a29bfe', '#fd79a8', '#74b9ff', '#ff7675', '#55efc4', '#dfe6e9'];
        return Object.entries(ranges).map(([label, value], i) => ({label, value, color: colors[i]}));
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
            svg.innerHTML = '<text x="150" y="150" text-anchor="middle" fill="#868e96">Aucune donnée</text>';
            return;
        }

        let currentAngle = -90;
        const cx = 150, cy = 150, r = 120;

        const paths = data.map(d => {
            const angle = (d.value / total) * 360;
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
