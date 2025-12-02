// calendar.js - Gestion du calendrier des rendez-vous
const calendar = {
    currentDate: new Date(),
    
    // Ouvrir le calendrier
    open() {
        const modal = document.getElementById('calendarModal');
        if (!modal) {
            this.createModal();
        }
        
        this.render();
        document.getElementById('calendarModal').classList.add('active');
    },
    
    // Fermer le calendrier
    close() {
        document.getElementById('calendarModal').classList.remove('active');
    },
    
    // Créer la modal du calendrier
    createModal() {
        const modalHTML = `
            <div id="calendarModal" class="modal calendar-modal">
                <div class="modal-header">
                    <h2>📅 Calendrier des rendez-vous</h2>
                    <button class="close-btn" onclick="calendar.close()">✕</button>
                </div>
                <div class="modal-content" style="padding: 0;">
                    <div class="calendar-controls">
                        <button class="calendar-nav-btn" onclick="calendar.previousMonth()">◀</button>
                        <h3 id="calendarMonthYear"></h3>
                        <button class="calendar-nav-btn" onclick="calendar.nextMonth()">▶</button>
                    </div>
                    <div id="calendarGrid" class="calendar-grid"></div>
                    <div id="calendarDetails" class="calendar-details" style="display: none;">
                        <h4 id="calendarDetailsDate"></h4>
                        <div id="calendarDetailsList"></div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    // Naviguer au mois précédent
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    },
    
    // Naviguer au mois suivant
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    },
    
    // Récupérer tous les RDV
    getMeetings() {
        const meetings = {};
        
        app.dataStore.contacts.forEach(contact => {
            if (contact.meetingDate) {
                const date = contact.meetingDate; // Format: YYYY-MM-DD
                if (!meetings[date]) {
                    meetings[date] = [];
                }
                meetings[date].push({
                    id: contact.id,
                    firstName: contact.firstName,
                    instagram: contact.instagram,
                    meetingDate: contact.meetingDate
                });
            }
        });
        
        return meetings;
    },
    
    // Rendre le calendrier
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Mettre à jour le titre
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
        
        // Récupérer les RDV
        const meetings = this.getMeetings();
        
        // Calculer le premier jour du mois et le nombre de jours
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
        
        // Ajuster pour commencer le lundi (0 = Lundi)
        const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        
        // Générer le calendrier
        let calendarHTML = `
            <div class="calendar-header">
                <div class="calendar-day-name">Lun</div>
                <div class="calendar-day-name">Mar</div>
                <div class="calendar-day-name">Mer</div>
                <div class="calendar-day-name">Jeu</div>
                <div class="calendar-day-name">Ven</div>
                <div class="calendar-day-name">Sam</div>
                <div class="calendar-day-name">Dim</div>
            </div>
            <div class="calendar-days">
        `;
        
        // Ajouter les jours vides avant le début du mois
        for (let i = 0; i < adjustedStartDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Date d'aujourd'hui pour comparaison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Ajouter les jours du mois
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            currentDate.setHours(0, 0, 0, 0);
            // Utiliser une fonction locale sans conversion UTC
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const hasMeeting = meetings[dateString] && meetings[dateString].length > 0;
            const isToday = currentDate.getTime() === today.getTime();
            const isPast = currentDate < today;
            
            let classes = 'calendar-day';
            if (hasMeeting) classes += ' has-meeting';
            if (isToday) classes += ' today';
            if (isPast) classes += ' past';
            
            const meetingCount = hasMeeting ? `<div class="meeting-dot">${meetings[dateString].length}</div>` : '';
            
            calendarHTML += `
                <div class="${classes}" onclick="calendar.showDayDetails('${dateString}')">
                    <span class="day-number">${day}</span>
                    ${meetingCount}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        
        document.getElementById('calendarGrid').innerHTML = calendarHTML;
        
        // Cacher les détails au changement de mois
        document.getElementById('calendarDetails').style.display = 'none';
    },
    
    // Afficher les détails d'un jour
    showDayDetails(dateString) {
        const meetings = this.getMeetings();
        const dayMeetings = meetings[dateString] || [];
        
        // Formater la date
        const date = new Date(dateString + 'T00:00:00');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('fr-FR', options);
        
        document.getElementById('calendarDetailsDate').textContent = formattedDate;
        
        // Si pas de RDV, afficher un message
        if (dayMeetings.length === 0) {
            document.getElementById('calendarDetailsList').innerHTML = `
                <div class="calendar-no-meeting">
                    <div class="no-meeting-icon">📭</div>
                    <div class="no-meeting-text">Pas de rendez-vous ce jour-là</div>
                </div>
            `;
            document.getElementById('calendarDetails').style.display = 'block';
            document.getElementById('calendarDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            return;
        }
        
        // Générer la liste des contacts
        let listHTML = '';
        dayMeetings.forEach(meeting => {
            listHTML += `
                <div class="calendar-meeting-item" onclick="calendar.close(); contacts.viewProfile('${meeting.id}')">
                    <div class="meeting-item-name">${meeting.firstName}</div>
                    <div class="meeting-item-instagram">${meeting.instagram}</div>
                </div>
            `;
        });
        
        document.getElementById('calendarDetailsList').innerHTML = listHTML;
        document.getElementById('calendarDetails').style.display = 'block';
        
        // Scroller vers les détails
        document.getElementById('calendarDetails').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

// Exposer globalement
window.calendar = calendar;
