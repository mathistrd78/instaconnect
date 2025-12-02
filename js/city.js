// city.js - Gestion de la recherche de villes
const city = {
    currentInput: null,
    currentDropdown: null,
    debounceTimer: null,

    // Mapping des codes pays vers emojis drapeaux
    countryFlags: {
        'FR': '🇫🇷', 'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'ES': '🇪🇸',
        'IT': '🇮🇹', 'PT': '🇵🇹', 'BE': '🇧🇪', 'CH': '🇨🇭', 'NL': '🇳🇱',
        'CA': '🇨🇦', 'BR': '🇧🇷', 'AR': '🇦🇷', 'MX': '🇲🇽', 'JP': '🇯🇵',
        'CN': '🇨🇳', 'IN': '🇮🇳', 'AU': '🇦🇺', 'RU': '🇷🇺', 'ZA': '🇿🇦',
        'EG': '🇪🇬', 'MA': '🇲🇦', 'DZ': '🇩🇿', 'TN': '🇹🇳', 'SN': '🇸🇳',
        'CI': '🇨🇮', 'CM': '🇨🇲', 'KE': '🇰🇪', 'NG': '🇳🇬', 'GH': '🇬🇭',
        'PL': '🇵🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
        'GR': '🇬🇷', 'TR': '🇹🇷', 'AT': '🇦🇹', 'CZ': '🇨🇿', 'HU': '🇭🇺',
        'RO': '🇷🇴', 'BG': '🇧🇬', 'HR': '🇭🇷', 'RS': '🇷🇸', 'SK': '🇸🇰',
        'SI': '🇸🇮', 'IE': '🇮🇪', 'LU': '🇱🇺', 'IS': '🇮🇸', 'MT': '🇲🇹',
        'CY': '🇨🇾', 'EE': '🇪🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'UA': '🇺🇦',
        'BY': '🇧🇾', 'MD': '🇲🇩', 'AL': '🇦🇱', 'MK': '🇲🇰', 'BA': '🇧🇦',
        'ME': '🇲🇪', 'XK': '🇽🇰', 'IL': '🇮🇱', 'SA': '🇸🇦', 'AE': '🇦🇪',
        'QA': '🇶🇦', 'KW': '🇰🇼', 'OM': '🇴🇲', 'JO': '🇯🇴', 'LB': '🇱🇧',
        'SY': '🇸🇾', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'AF': '🇦🇫', 'PK': '🇵🇰',
        'BD': '🇧🇩', 'LK': '🇱🇰', 'NP': '🇳🇵', 'MM': '🇲🇲', 'TH': '🇹🇭',
        'VN': '🇻🇳', 'KH': '🇰🇭', 'LA': '🇱🇦', 'MY': '🇲🇾', 'SG': '🇸🇬',
        'ID': '🇮🇩', 'PH': '🇵🇭', 'KR': '🇰🇷', 'KP': '🇰🇵', 'MN': '🇲🇳',
        'TW': '🇹🇼', 'HK': '🇭🇰', 'MO': '🇲🇴', 'NZ': '🇳🇿', 'FJ': '🇫🇯',
        'PG': '🇵🇬', 'NC': '🇳🇨', 'PF': '🇵🇫', 'CL': '🇨🇱', 'PE': '🇵🇪',
        'CO': '🇨🇴', 'VE': '🇻🇪', 'EC': '🇪🇨', 'BO': '🇧🇴', 'PY': '🇵🇾',
        'UY': '🇺🇾', 'CR': '🇨🇷', 'PA': '🇵🇦', 'CU': '🇨🇺', 'DO': '🇩🇴',
        'HT': '🇭🇹', 'JM': '🇯🇲', 'TT': '🇹🇹', 'BS': '🇧🇸', 'BB': '🇧🇧'
    },

    // Obtenir le drapeau d'un pays
    getFlag(countryCode) {
        return this.countryFlags[countryCode] || '🌍';
    },

    // Rechercher des villes via l'API geocoding
    async searchCities(query) {
        if (!query || query.length < 2) return [];

        try {
            // Utiliser l'API Nominatim d'OpenStreetMap (gratuite, pas de clé API requise)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(query)}&` +
                `format=json&` +
                `addressdetails=1&` +
                `limit=8&` +
                `accept-language=fr`,
                {
                    headers: {
                        'User-Agent': 'InstaConnect CRM'
                    }
                }
            );

            if (!response.ok) return [];

            const results = await response.json();

            // Filtrer et formater les résultats pour ne garder que les villes
            return results
                .filter(r => r.type === 'city' || r.type === 'town' || r.type === 'village' || 
                           r.type === 'municipality' || r.address?.city || r.address?.town || r.address?.village)
                .map(r => {
                    const city = r.address?.city || r.address?.town || r.address?.village || r.name;
                    const country = r.address?.country || '';
                    const countryCode = r.address?.country_code?.toUpperCase() || '';
                    const state = r.address?.state || '';

                    return {
                        city: city,
                        country: country,
                        countryCode: countryCode,
                        state: state,
                        displayName: state && state !== city ? `${city}, ${state}, ${country}` : `${city}, ${country}`,
                        flag: this.getFlag(countryCode)
                    };
                })
                .filter((item, index, self) => 
                    // Dédupliquer par city + country
                    index === self.findIndex(t => t.city === item.city && t.country === item.country)
                )
                .slice(0, 6); // Limiter à 6 résultats
        } catch (error) {
            console.error('Erreur recherche ville:', error);
            return [];
        }
    },

    // Initialiser un champ de recherche de ville
    initCityField(inputId, onSelect) {
        console.log('🔍 initCityField called for:', inputId);
        
        const input = document.getElementById(inputId);
        if (!input) {
            console.error('❌ Input not found:', inputId);
            return;
        }
        
        console.log('✅ Input found, creating dropdown for:', inputId);

        // Créer le dropdown s'il n'existe pas
        let dropdown = document.getElementById(inputId + 'Dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = inputId + 'Dropdown';
            dropdown.className = 'city-dropdown';
            input.parentElement.appendChild(dropdown);
            console.log('✅ Dropdown created for:', inputId);
        }

        // Événement sur l'input
        input.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            // Afficher un loader
            dropdown.innerHTML = '<div class="city-dropdown-item loading">🔍 Recherche...</div>';
            dropdown.style.display = 'block';

            // Debounce pour éviter trop de requêtes
            this.debounceTimer = setTimeout(async () => {
                const cities = await this.searchCities(query);

                if (cities.length === 0) {
                    dropdown.innerHTML = '<div class="city-dropdown-item no-results">Aucune ville trouvée</div>';
                } else {
                    dropdown.innerHTML = cities.map(city => `
                        <div class="city-dropdown-item" data-city='${JSON.stringify(city)}'>
                            <span class="city-flag">${city.flag}</span>
                            <span class="city-name">${city.displayName}</span>
                        </div>
                    `).join('');

                    // Ajouter les événements de clic
                    dropdown.querySelectorAll('.city-dropdown-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const cityData = JSON.parse(item.getAttribute('data-city'));
                            input.value = cityData.displayName;
                            dropdown.style.display = 'none';
                            if (onSelect) onSelect(cityData);
                        });
                    });
                }
            }, 300); // Attendre 300ms après la dernière frappe
        });

        // Fermer le dropdown si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    },

    // Parser une valeur existante pour extraire ville/pays
    parseLocation(locationString) {
        if (!locationString) return null;

        // Si c'est déjà un objet JSON stringifié
        try {
            const parsed = JSON.parse(locationString);
            if (parsed.city && parsed.country) {
                // S'assurer que le drapeau est présent
                if (!parsed.flag && parsed.countryCode) {
                    parsed.flag = this.getFlag(parsed.countryCode);
                }
                return parsed;
            }
        } catch (e) {
            // Pas un JSON, continuer
        }

        // Essayer de parser une chaîne "Ville, Pays" ou "Ville, État, Pays"
        const parts = locationString.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            const city = parts[0];
            const country = parts[parts.length - 1];
            const state = parts.length > 2 ? parts[1] : '';
            
            // Trouver le code pays et le drapeau
            // Amélioration : chercher dans les noms complets de pays
            let countryCode = '';
            
            // Mapping des noms de pays vers codes
            const countryNames = {
                'france': 'FR', 'états-unis': 'US', 'usa': 'US', 'etats-unis': 'US',
                'royaume-uni': 'GB', 'uk': 'GB', 'angleterre': 'GB',
                'allemagne': 'DE', 'espagne': 'ES', 'italie': 'IT',
                'portugal': 'PT', 'belgique': 'BE', 'suisse': 'CH',
                'pays-bas': 'NL', 'hollande': 'NL', 'canada': 'CA',
                'brésil': 'BR', 'bresil': 'BR', 'argentine': 'AR',
                'mexique': 'MX', 'japon': 'JP', 'chine': 'CN',
                'inde': 'IN', 'australie': 'AU', 'russie': 'RU',
                'afrique du sud': 'ZA', 'maroc': 'MA', 'algérie': 'DZ',
                'tunisie': 'TN', 'egypte': 'EG', 'grèce': 'GR',
                'turquie': 'TR', 'pologne': 'PL', 'suède': 'SE'
            };
            
            const countryLower = country.toLowerCase();
            countryCode = countryNames[countryLower] || '';
            
            // Si pas trouvé, essayer avec les codes pays directs
            if (!countryCode) {
                countryCode = Object.keys(this.countryFlags).find(
                    code => countryLower.includes(code.toLowerCase())
                ) || '';
            }

            return {
                city: city,
                country: country,
                countryCode: countryCode,
                state: state,
                displayName: locationString,
                flag: this.getFlag(countryCode)
            };
        }

        // Si c'est juste un nom de ville sans pays, retourner quand même quelque chose
        if (locationString.trim()) {
            return {
                city: locationString.trim(),
                country: '',
                countryCode: '',
                displayName: locationString.trim(),
                flag: '🌍' // Globe par défaut
            };
        }

        return null;
    },

    // Obtenir les statistiques par pays
    getCountryStats(contacts) {
        const countryCount = {};
        
        contacts.forEach(contact => {
            const location = this.parseLocation(contact.location);
            if (location && location.country) {
                const key = location.country;
                if (!countryCount[key]) {
                    countryCount[key] = {
                        country: location.country,
                        countryCode: location.countryCode,
                        flag: location.flag,
                        count: 0
                    };
                }
                countryCount[key].count++;
            }
        });

        return Object.values(countryCount).sort((a, b) => b.count - a.count);
    }
};

// Exposer globalement
window.city = city;
