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

    // Liste de villes populaires pour recherche rapide (sans API)
    popularCities: [
        { city: 'Paris', country: 'France', countryCode: 'FR', displayName: 'Paris, France' },
        { city: 'Lyon', country: 'France', countryCode: 'FR', displayName: 'Lyon, France' },
        { city: 'Marseille', country: 'France', countryCode: 'FR', displayName: 'Marseille, France' },
        { city: 'Toulouse', country: 'France', countryCode: 'FR', displayName: 'Toulouse, France' },
        { city: 'Nice', country: 'France', countryCode: 'FR', displayName: 'Nice, France' },
        { city: 'Nantes', country: 'France', countryCode: 'FR', displayName: 'Nantes, France' },
        { city: 'Strasbourg', country: 'France', countryCode: 'FR', displayName: 'Strasbourg, France' },
        { city: 'Montpellier', country: 'France', countryCode: 'FR', displayName: 'Montpellier, France' },
        { city: 'Bordeaux', country: 'France', countryCode: 'FR', displayName: 'Bordeaux, France' },
        { city: 'Lille', country: 'France', countryCode: 'FR', displayName: 'Lille, France' },
        { city: 'Rennes', country: 'France', countryCode: 'FR', displayName: 'Rennes, France' },
        { city: 'Reims', country: 'France', countryCode: 'FR', displayName: 'Reims, France' },
        { city: 'Le Havre', country: 'France', countryCode: 'FR', displayName: 'Le Havre, France' },
        { city: 'Saint-Étienne', country: 'France', countryCode: 'FR', displayName: 'Saint-Étienne, France' },
        { city: 'Toulon', country: 'France', countryCode: 'FR', displayName: 'Toulon, France' },
        { city: 'Grenoble', country: 'France', countryCode: 'FR', displayName: 'Grenoble, France' },
        { city: 'Dijon', country: 'France', countryCode: 'FR', displayName: 'Dijon, France' },
        { city: 'Angers', country: 'France', countryCode: 'FR', displayName: 'Angers, France' },
        { city: 'Nîmes', country: 'France', countryCode: 'FR', displayName: 'Nîmes, France' },
        { city: 'Villeurbanne', country: 'France', countryCode: 'FR', displayName: 'Villeurbanne, France' },
        { city: 'New York', country: 'United States', countryCode: 'US', displayName: 'New York, United States' },
        { city: 'Los Angeles', country: 'United States', countryCode: 'US', displayName: 'Los Angeles, United States' },
        { city: 'Chicago', country: 'United States', countryCode: 'US', displayName: 'Chicago, United States' },
        { city: 'Houston', country: 'United States', countryCode: 'US', displayName: 'Houston, United States' },
        { city: 'Miami', country: 'United States', countryCode: 'US', displayName: 'Miami, United States' },
        { city: 'San Francisco', country: 'United States', countryCode: 'US', displayName: 'San Francisco, United States' },
        { city: 'London', country: 'United Kingdom', countryCode: 'GB', displayName: 'London, United Kingdom' },
        { city: 'Manchester', country: 'United Kingdom', countryCode: 'GB', displayName: 'Manchester, United Kingdom' },
        { city: 'Birmingham', country: 'United Kingdom', countryCode: 'GB', displayName: 'Birmingham, United Kingdom' },
        { city: 'Berlin', country: 'Germany', countryCode: 'DE', displayName: 'Berlin, Germany' },
        { city: 'Munich', country: 'Germany', countryCode: 'DE', displayName: 'Munich, Germany' },
        { city: 'Hamburg', country: 'Germany', countryCode: 'DE', displayName: 'Hamburg, Germany' },
        { city: 'Madrid', country: 'Spain', countryCode: 'ES', displayName: 'Madrid, Spain' },
        { city: 'Barcelona', country: 'Spain', countryCode: 'ES', displayName: 'Barcelona, Spain' },
        { city: 'Rome', country: 'Italy', countryCode: 'IT', displayName: 'Rome, Italy' },
        { city: 'Milan', country: 'Italy', countryCode: 'IT', displayName: 'Milan, Italy' },
        { city: 'Brussels', country: 'Belgium', countryCode: 'BE', displayName: 'Brussels, Belgium' },
        { city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', displayName: 'Amsterdam, Netherlands' },
        { city: 'Lisbon', country: 'Portugal', countryCode: 'PT', displayName: 'Lisbon, Portugal' },
        { city: 'Toronto', country: 'Canada', countryCode: 'CA', displayName: 'Toronto, Canada' },
        { city: 'Montreal', country: 'Canada', countryCode: 'CA', displayName: 'Montreal, Canada' },
        { city: 'Tokyo', country: 'Japan', countryCode: 'JP', displayName: 'Tokyo, Japan' },
        { city: 'Sydney', country: 'Australia', countryCode: 'AU', displayName: 'Sydney, Australia' },
        { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', displayName: 'Dubai, United Arab Emirates' }
    ],

    // Rechercher dans les villes populaires
    searchPopularCities(query) {
        const searchLower = query.toLowerCase();
        return this.popularCities
            .filter(city => city.city.toLowerCase().startsWith(searchLower))
            .map(city => ({
                ...city,
                flag: this.getFlag(city.countryCode)
            }))
            .slice(0, 6);
    },

    // Obtenir le drapeau d'un pays
    getFlag(countryCode) {
        return this.countryFlags[countryCode] || '🌍';
    },

    // Rechercher des villes via l'API geocoding + cache local
    async searchCities(query) {
        if (!query || query.length < 1) return [];

        // Liste des pays populaires pour l'autocomplétion
        const popularCountries = [
            { name: 'France', code: 'FR' },
            { name: 'Espagne', code: 'ES' },
            { name: 'Italie', code: 'IT' },
            { name: 'Allemagne', code: 'DE' },
            { name: 'Belgique', code: 'BE' },
            { name: 'Suisse', code: 'CH' },
            { name: 'Portugal', code: 'PT' },
            { name: 'Royaume-Uni', code: 'GB' },
            { name: 'États-Unis', code: 'US' },
            { name: 'Canada', code: 'CA' },
            { name: 'Maroc', code: 'MA' },
            { name: 'Algérie', code: 'DZ' },
            { name: 'Tunisie', code: 'TN' }
        ];

        // Si la recherche ressemble à un pays (pas de virgule, <= 15 caractères)
        const queryLower = query.toLowerCase();
        if (!query.includes(',') && query.length <= 15) {
            const matchingCountries = popularCountries
                .filter(c => c.name.toLowerCase().startsWith(queryLower))
                .map(c => ({
                    city: '',
                    country: c.name,
                    countryCode: c.code,
                    state: '',
                    displayName: c.name,
                    flag: this.getFlag(c.code)
                }));
            
            // Si on trouve des pays correspondants, les retourner en premier
            if (matchingCountries.length > 0) {
                // Continuer aussi la recherche de villes
                const cityResults = await this.searchCitiesOnly(query);
                return [...matchingCountries, ...cityResults].slice(0, 8);
            }
        }

        return this.searchCitiesOnly(query);
    },

    async searchCitiesOnly(query) {
        if (!query || query.length < 1) return [];

        // Pour 1 caractère, chercher seulement dans les villes populaires
        if (query.length === 1) {
            return this.searchPopularCities(query);
        }

        try {
            // Chercher d'abord dans les villes populaires
            const popularResults = this.searchPopularCities(query);
            
            // Si on a déjà 6 résultats populaires qui commencent par la recherche, les retourner directement
            if (popularResults.length >= 6) {
                return popularResults;
            }

            // Sinon, faire aussi une recherche API
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

            if (!response.ok) return popularResults; // Retourner les résultats populaires si l'API échoue

            const results = await response.json();

            // Filtrer et formater les résultats pour ne garder que les villes
            const apiResults = results
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
                );
            
            // Combiner les résultats : populaires d'abord, puis API
            const combined = [...popularResults];
            const popularCityNames = new Set(popularResults.map(c => `${c.city}|${c.country}`));
            
            // Ajouter les résultats API qui ne sont pas déjà dans les populaires
            apiResults.forEach(city => {
                const key = `${city.city}|${city.country}`;
                if (!popularCityNames.has(key) && combined.length < 8) {
                    combined.push(city);
                }
            });
            
            return combined.slice(0, 6); // Limiter à 6 résultats finaux
        } catch (error) {
            console.error('Erreur recherche ville:', error);
            return this.searchPopularCities(query); // Retourner les résultats populaires en cas d'erreur
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

            if (query.length < 1) {
                dropdown.style.display = 'none';
                return;
            }

            // Afficher un loader
            dropdown.innerHTML = '<div class="city-dropdown-item loading">🔍 Recherche...</div>';
            dropdown.style.display = 'block';

            // Debounce pour éviter trop de requêtes (plus court pour 1 caractère)
            const debounceDelay = query.length === 1 ? 100 : 300;
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
            'algerie': 'DZ', 'tunisie': 'TN', 'egypte': 'EG', 
            'grèce': 'GR', 'grece': 'GR', 'turquie': 'TR', 
            'pologne': 'PL', 'suède': 'SE', 'suede': 'SE'
        };
        
        // Si c'est un seul mot, vérifier si c'est un nom de pays
        if (parts.length === 1) {
            const textLower = locationString.toLowerCase().trim();
            const countryCode = countryNames[textLower];
            
            if (countryCode) {
                // C'est un pays reconnu !
                return {
                    city: '',
                    country: locationString.trim(),
                    countryCode: countryCode,
                    state: '',
                    displayName: locationString.trim(),
                    flag: this.getFlag(countryCode)
                };
            }
        }
        
        if (parts.length >= 2) {
            const city = parts[0];
            const country = parts[parts.length - 1];
            const state = parts.length > 2 ? parts[1] : '';
            
            // Trouver le code pays et le drapeau
            let countryCode = '';
            
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
        let undefinedCount = 0;
        
        contacts.forEach(contact => {
            let location = null;
            
            // Si contact.location est déjà un objet
            if (typeof contact.location === 'object' && contact.location !== null) {
                location = contact.location;
            }
            // Sinon, parser
            else if (contact.location) {
                location = this.parseLocation(contact.location);
            }
            
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
            } else {
                // Pas de pays défini
                undefinedCount++;
            }
        });

        const result = Object.values(countryCount).sort((a, b) => b.count - a.count);
        
        // Ajouter "Non défini" à la fin si nécessaire
        if (undefinedCount > 0) {
            result.push({
                country: 'Non défini',
                countryCode: '',
                flag: '❓',
                count: undefinedCount
            });
        }
        
        return result;
    }
};

// Exposer globalement
window.city = city;
