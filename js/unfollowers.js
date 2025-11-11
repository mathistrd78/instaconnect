// unfollowers.js - Analyse des unfollowers Instagram
const unfollowers = {
    data: {
        following: [],
        followers: [],
        unfollowers: [],
        marked: new Set(),
        normalUnfollowers: new Set(), // Influenceurs, marques...
        doNotFollowList: new Set(), // Personnes à ne plus suivre (et déjà unfollowed)
        normalCategories: {} // Catégories des unfollowers normaux
    },
    
    pendingFile: null, // Fichier en attente d'analyse

    init() {
        console.log('🚀 Unfollowers init started');
        
        // Detect PWA mode
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true ||
                     document.referrer.includes('android-app://');
        
        if (isPWA) {
            console.log('📱 PWA mode detected - using special handling');
            this.isPWAMode = true;
        } else {
            console.log('🌐 Browser mode detected');
            this.isPWAMode = false;
        }
        
        // Load saved lists
        const savedNormal = localStorage.getItem('normalUnfollowers');
        if (savedNormal) {
            this.data.normalUnfollowers = new Set(JSON.parse(savedNormal));
        }
        
        const savedDoNotFollow = localStorage.getItem('doNotFollowList');
        if (savedDoNotFollow) {
            this.data.doNotFollowList = new Set(JSON.parse(savedDoNotFollow));
        }
        
        const savedCategories = localStorage.getItem('normalCategories');
        if (savedCategories) {
            this.data.normalCategories = JSON.parse(savedCategories);
        }
        
        // Update counts
        this.updateCounts();

        // Setup file input with retry for mobile
        this.setupFileInput();
        
        // Retry after a delay if not found (mobile can be slow)
        setTimeout(() => {
            if (!document.getElementById('zipFileInput')._hasListeners) {
                console.log('🔄 Retrying file input setup...');
                this.setupFileInput();
            }
        }, 1000);
    },
    
    setupFileInput() {
        // Setup drag & drop
        const uploadZone = document.getElementById('uploadZone');
        
        if (uploadZone) {
            console.log('✅ Upload zone found');
            
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].name.endsWith('.zip')) {
                    this.handleFileUpload({target: {files: [files[0]]}});
                } else {
                    alert('Veuillez déposer un fichier ZIP');
                }
            });
        } else {
            console.log('❌ Upload zone not found');
        }
        
        // Setup file input
        const fileInput = document.getElementById('zipFileInput');
        if (fileInput) {
            // Check if already has listeners
            if (fileInput._hasListeners) {
                console.log('⏭️ File input already has listeners');
                return;
            }
            
            console.log('📁 File input found, attaching event listeners');
            
            // Multiple event listeners for better mobile compatibility
            fileInput.addEventListener('change', (e) => {
                console.log('📁 Change event triggered');
                this.handleFileUpload(e);
            }, { passive: true });
            
            // iOS sometimes needs input event
            fileInput.addEventListener('input', (e) => {
                console.log('📁 Input event triggered');
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFileUpload(e);
                }
            }, { passive: true });
            
            // PWA iOS FIX: Poll for file selection since events don't fire
            if (this.isPWAMode) {
                console.log('📱 PWA mode - setting up polling...');
                let lastFileCount = 0;
                
                const checkForFile = () => {
                    const currentFileCount = fileInput.files ? fileInput.files.length : 0;
                    if (currentFileCount > 0 && currentFileCount !== lastFileCount) {
                        console.log('📱 File detected via polling! Files:', currentFileCount);
                        lastFileCount = currentFileCount;
                        this.handleFileUpload({target: fileInput});
                    }
                };
                
                // Poll every 300ms
                fileInput._pollInterval = setInterval(checkForFile, 300);
                console.log('✅ Polling started for PWA (every 300ms)');
                
                // Also check on blur (when user closes file picker)
                fileInput.addEventListener('blur', () => {
                    console.log('📱 Input blurred - checking for file...');
                    setTimeout(() => {
                        if (fileInput.files && fileInput.files.length > 0) {
                            console.log('📱 File found on blur!');
                            this.handleFileUpload({target: fileInput});
                        }
                    }, 100);
                });
                
                // And on focus (when user returns to input)
                fileInput.addEventListener('focus', () => {
                    console.log('📱 Input focused');
                });
            }
            
            // Mark as having listeners
            fileInput._hasListeners = true;
            
            console.log('✅ File input event listeners attached');
        } else {
            console.log('❌ File input not found!');
        }
        
        // Prevent tag edit modal from closing when clicking inside
        const tagEditModal = document.getElementById('tagEditModal');
        if (tagEditModal) {
            tagEditModal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    },

    updateCounts() {
        document.getElementById('normalCount').textContent = this.data.normalUnfollowers.size;
        document.getElementById('doNotFollowCount').textContent = this.data.doNotFollowList.size;
    },

    saveNormalUnfollowers() {
        localStorage.setItem('normalUnfollowers', JSON.stringify([...this.data.normalUnfollowers]));
        localStorage.setItem('normalCategories', JSON.stringify(this.data.normalCategories));
        this.updateCounts();
        this.saveToFirebase();
    },
    
    saveDoNotFollowList() {
        localStorage.setItem('doNotFollowList', JSON.stringify([...this.data.doNotFollowList]));
        this.updateCounts();
        this.saveToFirebase();
    },
    
    async saveToFirebase() {
        if (!authManager.currentUser) return;
        
        try {
            const userId = authManager.currentUser.uid;
            await db.collection('users').doc(userId).set({
                normalUnfollowers: [...this.data.normalUnfollowers],
                doNotFollowList: [...this.data.doNotFollowList],
                normalCategories: this.data.normalCategories
            }, { merge: true });
            console.log('✅ Unfollowers lists saved to Firebase');
        } catch (error) {
            console.error('❌ Error saving unfollowers lists:', error);
        }
    },

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.zip')) {
            alert('Veuillez sélectionner un fichier ZIP');
            return;
        }

        // Store file and show discover button
        this.pendingFile = file;
        document.getElementById('discoverButtonContainer').style.display = 'block';
        
        // Update upload zone text
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.querySelector('.upload-text').textContent = '✅ Fichier chargé : ' + file.name;
        uploadZone.querySelector('.upload-subtext').textContent = 'Cliquez sur "Découvrir" pour analyser';
    },
    
    async analyzeFile() {
        if (!this.pendingFile) return;
        
        await this.processZipFile(this.pendingFile);
    },

    async processZipFile(file) {
        // Show analyzing state
        document.querySelector('.unfollowers-header').style.display = 'none';
        document.getElementById('analyzingState').style.display = 'block';
        document.getElementById('unfollowersResults').style.display = 'none';
        document.getElementById('emptyUnfollowers').style.display = 'none';

        try {
            // Load JSZip library from CDN
            if (typeof JSZip === 'undefined') {
                await this.loadJSZip();
            }

            const zip = new JSZip();
            const contents = await zip.loadAsync(file);

            // Find following and followers files
            let followingFile = null;
            let followersFile = null;

            contents.forEach((relativePath, zipEntry) => {
                if (relativePath.includes('following.json')) {
                    followingFile = zipEntry;
                } else if (relativePath.includes('followers_1.json')) {
                    followersFile = zipEntry;
                }
            });

            if (!followingFile || !followersFile) {
                throw new Error('Fichiers following.json ou followers_1.json introuvables dans le ZIP');
            }

            // Parse JSON files
            const followingText = await followingFile.async('text');
            const followersText = await followersFile.async('text');

            const followingData = JSON.parse(followingText);
            const followersData = JSON.parse(followersText);

            // Extract usernames with timestamps
            console.log('🔍 First following item:', followingData.relationships_following[0]);
            
            const followingList = followingData.relationships_following.map(item => ({
                username: item.title || item.string_list_data?.[0]?.value,
                timestamp: item.timestamp || null
            }));
            
            console.log('📅 First followingList item:', followingList[0]);
            
            this.data.following = followingList.map(f => f.username);
            this.data.followers = followersData.map(item => item.string_list_data[0].value);

            // Calculate unfollowers with dates (exclude normal ones AND do not follow list)
            this.data.unfollowers = followingList
                .filter(item => !this.data.followers.includes(item.username))
                .filter(item => !this.data.normalUnfollowers.has(item.username))
                .filter(item => !this.data.doNotFollowList.has(item.username)) // Exclure ceux qu'on ne veut plus suivre
                .map(item => ({
                    username: item.username,
                    timestamp: item.timestamp
                }))
                .sort((a, b) => a.username.localeCompare(b.username));
            
            console.log('👤 First unfollower with timestamp:', this.data.unfollowers[0]);

            // Reset marked for new analysis
            this.data.marked = new Set();

            // Display results
            this.displayResults();

        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'analyse du fichier: ' + error.message);
            this.reset();
        }
    },

    async loadJSZip() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    displayResults() {
        // Hide analyzing
        document.getElementById('analyzingState').style.display = 'none';

        // Update stats - NOUVEL ORDRE: Followers, Following, Unfollowers
        document.getElementById('followersCount').textContent = this.data.followers.length;
        document.getElementById('followingCount').textContent = this.data.following.length;
        document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
        // Update normal unfollowers count
        const normalCountEl = document.getElementById('normalCount');
        if (normalCountEl) {
            normalCountEl.textContent = this.data.normalUnfollowers.size;
        }

        if (this.data.unfollowers.length === 0) {
            document.getElementById('emptyUnfollowers').style.display = 'block';
            return;
        }

        // Display results
        document.getElementById('unfollowersResults').style.display = 'block';

        // Render list
        this.renderList();
    },

    renderList() {
        const list = document.getElementById('unfollowersList');
        
        // Helper function to get first meaningful letter (ignore special chars)
        const getFirstLetter = (username) => {
            // Remove leading special characters and get first alphabetic character
            const match = username.match(/[a-zA-Z]/);
            return match ? match[0].toUpperCase() : '#';
        };
        
        // Group by first letter
        const grouped = {};
        this.data.unfollowers.forEach(item => {
            const username = typeof item === 'string' ? item : item.username;
            const firstLetter = getFirstLetter(username);
            if (!grouped[firstLetter]) grouped[firstLetter] = [];
            grouped[firstLetter].push(item);
        });

        // Sort letters (# at the end)
        const letters = Object.keys(grouped).sort((a, b) => {
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        });

        // Render with sections
        const html = letters.map(letter => {
            const users = grouped[letter];
            const usersHtml = users.map(item => {
                const username = typeof item === 'string' ? item : item.username;
                const timestamp = typeof item === 'object' ? item.timestamp : null;
                const isMarked = this.data.marked.has(username);
                
                console.log(`🔍 Rendering ${username}, timestamp:`, timestamp, 'type:', typeof timestamp);
                
                // Format date if available
                let dateStr = '';
                if (timestamp) {
                    const date = new Date(timestamp * 1000); // Instagram timestamp is in seconds
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    dateStr = `<span class="unfollower-date">since ${day}-${month}-${year}</span>`;
                    console.log(`📅 Date formatted for ${username}:`, dateStr);
                }
                
                return `
                    <div class="unfollower-item ${isMarked ? 'unfollowed' : ''}" id="user-${username.replace(/[^a-zA-Z0-9]/g, '_')}">
                        <div class="unfollower-info">
                            <div class="unfollower-username">@${username}</div>
                            ${dateStr}
                        </div>
                        <div class="unfollower-actions">
                            <button class="btn-unfollow" onclick="unfollowers.openInstagram('${username}')" ${isMarked ? 'disabled' : ''}>
                                ${isMarked ? '✓ Fait' : '🔗 Profil'}
                            </button>
                            ${!isMarked ? `
                                <button class="btn-mark" onclick="unfollowers.markAsUnfollowed('${username}')" title="Marquer comme unfollowed">✓</button>
                                <button class="btn-normal" onclick="unfollowers.markAsNormal('${username}')" title="C'est normal">⭐</button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="letter-section">
                    <div class="letter-header">${letter}</div>
                    ${usersHtml}
                </div>
            `;
        }).join('');

        list.innerHTML = html;
    },

    openInstagram(username) {
        // Open Instagram profile - Fix pour PWA iOS
        const instagramUrl = `https://instagram.com/${username}`;
        const instagramApp = `instagram://user?username=${username}`;
        
        // En PWA, utiliser uniquement window.open (pas window.location)
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone === true;
        
        if (isPWA) {
            // PWA: Ouvrir directement dans un nouvel onglet
            console.log('📱 PWA mode - opening in new tab');
            window.open(instagramUrl, '_blank', 'noopener,noreferrer');
        } else {
            // Navigateur: Essayer d'ouvrir l'app Instagram d'abord
            console.log('🌐 Browser mode - trying app first');
            window.location.href = instagramApp;
            
            // Fallback vers le navigateur après un court délai
            setTimeout(() => {
                window.open(instagramUrl, '_blank', 'noopener,noreferrer');
            }, 500);
        }
    },

    markAsUnfollowed(username) {
        if (!confirm(`Ajouter @${username} à la liste "À ne plus suivre" ?\n\nCette personne sera retirée des unfollowers et vous serez alerté si vous tentez de la re-suivre.`)) {
            return;
        }

        // Add to do not follow list
        this.data.doNotFollowList.add(username);
        this.saveDoNotFollowList();
        
        // Remove from unfollowers list (handle both string and object format)
        this.data.unfollowers = this.data.unfollowers.filter(item => {
            const user = typeof item === 'string' ? item : item.username;
            return user !== username;
        });
        
        // Diminuer le compteur de following
        const followingCountEl = document.getElementById('followingCount');
        if (followingCountEl) {
            const currentFollowing = parseInt(followingCountEl.textContent);
            followingCountEl.textContent = currentFollowing - 1;
        }
        
        // Update unfollowers counter
        document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
        // Re-render
        if (this.data.unfollowers.length === 0) {
            document.getElementById('unfollowersResults').style.display = 'none';
            document.getElementById('emptyUnfollowers').style.display = 'block';
        } else {
            this.renderList();
        }
    },

    markAsNormal(username) {
        if (!confirm(`Marquer @${username} comme "unfollower normal" ?\nCe profil n'apparaîtra plus dans les prochaines analyses.`)) {
            return;
        }

        this.data.normalUnfollowers.add(username);
        this.saveNormalUnfollowers();
        
        // NOUVEAU: Remove from current list (handle both string and object format)
        this.data.unfollowers = this.data.unfollowers.filter(item => {
            const user = typeof item === 'string' ? item : item.username;
            return user !== username;
        });
        
        // Update counter
        document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
        // Re-render (disparaît immédiatement)
        if (this.data.unfollowers.length === 0) {
            document.getElementById('unfollowersResults').style.display = 'none';
            document.getElementById('emptyUnfollowers').style.display = 'block';
        } else {
            this.renderList();
        }
    },

    setCategoryForNormal(username, category) {
        this.data.normalCategories[username] = category;
        this.saveNormalUnfollowers();
    },

    getCategoryIcon(category) {
        const icons = {
            'disabled': '🚫',
            'celebrity': '⭐',
            'business': '💼'
        };
        return icons[category] || '';
    },

    getCategoryLabel(category) {
        const labels = {
            'disabled': 'Désactivé',
            'celebrity': 'Personnalité',
            'business': 'Marque/Pro'
        };
        return labels[category] || '';
    },

    showNormalUnfollowers() {
        if (this.data.normalUnfollowers.size === 0) {
            alert('Aucun unfollower normal enregistré');
            return;
        }

        const list = [...this.data.normalUnfollowers].sort();
        
        // Create the modal with filters and search
        const overlay = document.createElement('div');
        overlay.id = 'normalUnfollowersModal';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        overlay.innerHTML = `
            <div style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 18px;">⭐ Unfollowers normaux (${this.data.normalUnfollowers.size})</h3>
                        <button onclick="document.getElementById('normalUnfollowersModal').remove()" style="background: #f8f9fa; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">✕</button>
                    </div>
                    <input type="text" id="searchNormal" placeholder="🔍 Rechercher..." 
                           style="width: 100%; padding: 10px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px;"
                           oninput="unfollowers.filterNormalBySearch(this.value)">
                    <div style="display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
                        <button onclick="unfollowers.filterNormalByCategory('all')" id="filterAll" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            Tous
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('disabled')" id="filterDisabled" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            🚫 Désactivés
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('celebrity')" id="filterCelebrity" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            ⭐ Personnalités
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('business')" id="filterBusiness" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            💼 Marques/Pro
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('uncategorized')" id="filterUncategorized" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            Sans catégorie
                        </button>
                    </div>
                </div>
                <div id="normalUnfollowersList" style="padding: 16px; overflow-y: auto; flex: 1;">
                    ${this.renderNormalList(list, 'all', '')}
                </div>
            </div>
        `;

        // Remove existing overlay if any
        document.getElementById('normalUnfollowersModal')?.remove();
        
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    },
    
    renderNormalList(list, filter, searchTerm = '') {
        const filteredList = list.filter(username => {
            const category = this.data.normalCategories[username] || null;
            
            // Filter by category
            let categoryMatch = true;
            if (filter === 'all') categoryMatch = true;
            else if (filter === 'uncategorized') categoryMatch = !category;
            else categoryMatch = category === filter;
            
            // Filter by search term
            const searchMatch = username.toLowerCase().includes(searchTerm.toLowerCase());
            
            return categoryMatch && searchMatch;
        });
        
        if (filteredList.length === 0) {
            return '<div style="text-align: center; color: #6c757d; padding: 20px;">Aucun résultat</div>';
        }
        
        return filteredList.map(username => {
            const category = this.data.normalCategories[username] || null;
            return `
                <div class="unfollower-item" style="padding: 12px;">
                    <div class="unfollower-info">
                        <div class="unfollower-username">
                            <a href="https://instagram.com/${username}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: none;">@${username}</a>
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button onclick="unfollowers.setCategoryForNormal('${username}', 'disabled'); unfollowers.refreshNormalList();" 
                            style="background: ${category === 'disabled' ? '#ff4757' : '#f8f9fa'}; color: ${category === 'disabled' ? 'white' : '#495057'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 16px;" 
                            title="Compte désactivé">
                            🚫
                        </button>
                        <button onclick="unfollowers.setCategoryForNormal('${username}', 'celebrity'); unfollowers.refreshNormalList();" 
                            style="background: ${category === 'celebrity' ? '#ffd93d' : '#f8f9fa'}; color: ${category === 'celebrity' ? 'white' : '#495057'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 16px;" 
                            title="Personnalité publique">
                            ⭐
                        </button>
                        <button onclick="unfollowers.setCategoryForNormal('${username}', 'business'); unfollowers.refreshNormalList();" 
                            style="background: ${category === 'business' ? '#5f27cd' : '#f8f9fa'}; color: ${category === 'business' ? 'white' : '#495057'}; border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; font-size: 16px;" 
                            title="Marque/Contenu pro">
                            💼
                        </button>
                        <button class="btn-mark" onclick="unfollowers.removeFromNormal('${username}')" style="background: #ff4757; color: white; padding: 6px 10px;">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    filterNormalBySearch(searchTerm) {
        // Get current category filter
        const buttons = ['filterAll', 'filterDisabled', 'filterCelebrity', 'filterBusiness', 'filterUncategorized'];
        let currentFilter = 'all';
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn && btn.style.background === 'rgb(0, 123, 255)') {
                currentFilter = btnId.replace('filter', '').toLowerCase();
            }
        });
        
        // Re-render with both filters
        const list = [...this.data.normalUnfollowers].sort();
        const listContainer = document.getElementById('normalUnfollowersList');
        if (listContainer) {
            listContainer.innerHTML = this.renderNormalList(list, currentFilter, searchTerm);
        }
    },

        // Remove existing overlay if any
        document.getElementById('normalUnfollowersModal')?.remove();
        
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    },
    
    
    filterNormalByCategory(category) {
        // Update button styles
        ['All', 'Disabled', 'Celebrity', 'Business', 'Uncategorized'].forEach(cat => {
            const btn = document.getElementById(`filter${cat}`);
            if (btn) {
                if (cat.toLowerCase() === category || (cat === 'All' && category === 'all')) {
                    btn.style.background = '#007bff';
                    btn.style.color = 'white';
                } else {
                    btn.style.background = '#f8f9fa';
                    btn.style.color = '#495057';
                }
            }
        });
        
        // Get current search term
        const searchInput = document.getElementById('searchNormal');
        const searchTerm = searchInput ? searchInput.value : '';
        
        // Re-render list with filter and search
        const list = [...this.data.normalUnfollowers].sort();
        const listContainer = document.getElementById('normalUnfollowersList');
        if (listContainer) {
            listContainer.innerHTML = this.renderNormalList(list, category, searchTerm);
        }
    },
    
    refreshNormalList() {
        // Get current filter
        const buttons = ['filterAll', 'filterDisabled', 'filterCelebrity', 'filterBusiness', 'filterUncategorized'];
        let currentFilter = 'all';
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn && btn.style.background === 'rgb(0, 123, 255)') {
                currentFilter = btnId.replace('filter', '').toLowerCase();
            }
        });
        
        this.filterNormalByCategory(currentFilter);
    },

    removeFromNormal(username) {
        this.data.normalUnfollowers.delete(username);
        delete this.data.normalCategories[username];
        this.saveNormalUnfollowers();
        
        // Close the modal
        document.getElementById('normalUnfollowersModal')?.remove();
        
        // Show confirmation
        alert(`@${username} retiré des unfollowers normaux.\nIl réapparaîtra lors de la prochaine analyse.`);
    },

    showDoNotFollowList() {
        if (this.data.doNotFollowList.size === 0) {
            alert('Aucun utilisateur dans la liste "À ne plus suivre"');
            return;
        }

        const list = [...this.data.doNotFollowList].sort();
        
        // Create the modal with search
        const overlay = document.createElement('div');
        overlay.id = 'doNotFollowModal';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        overlay.innerHTML = `
            <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 18px;">🚫 À ne plus suivre (${this.data.doNotFollowList.size})</h3>
                        <button onclick="document.getElementById('doNotFollowModal').remove()" style="background: #f8f9fa; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">✕</button>
                    </div>
                    <input type="text" id="searchDoNotFollow" placeholder="🔍 Rechercher..." 
                           style="width: 100%; padding: 10px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                           oninput="unfollowers.filterDoNotFollowList(this.value)">
                </div>
                <div id="doNotFollowList" style="padding: 16px; overflow-y: auto; flex: 1;">
                    ${this.renderDoNotFollowList(list, '')}
                </div>
            </div>
        `;

        // Remove existing overlay if any
        document.getElementById('doNotFollowModal')?.remove();
        
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    },
    
    renderDoNotFollowList(list, searchTerm) {
        const filteredList = list.filter(username => 
            username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filteredList.length === 0) {
            return '<div style="text-align: center; color: #6c757d; padding: 20px;">Aucun résultat</div>';
        }
        
        return filteredList.map(username => `
            <div class="unfollower-item">
                <div class="unfollower-info">
                    <div class="unfollower-username">
                        <a href="https://instagram.com/${username}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: none;">@${username}</a>
                    </div>
                </div>
                <button class="btn-mark" onclick="unfollowers.removeFromDoNotFollow('${username}')" style="background: #ff4757; color: white;">
                    ✕ Retirer
                </button>
            </div>
        `).join('');
    },
    
    filterDoNotFollowList(searchTerm) {
        const list = [...this.data.doNotFollowList].sort();
        const listContainer = document.getElementById('doNotFollowList');
        if (listContainer) {
            listContainer.innerHTML = this.renderDoNotFollowList(list, searchTerm);
        }
    },
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    },

    removeFromDoNotFollow(username) {
        this.data.doNotFollowList.delete(username);
        this.saveDoNotFollowList();
        
        // Close and refresh the modal
        document.querySelector('body > div[style*="position: fixed"]')?.remove();
        
        alert(`@${username} retiré de la liste "À ne plus suivre".`);
    },

    reset() {
        this.data.following = [];
        this.data.followers = [];
        this.data.unfollowers = [];
        this.data.marked = new Set();
        this.pendingFile = null;
        // Keep normalUnfollowers, doNotFollowList and normalCategories saved

        document.querySelector('.unfollowers-header').style.display = 'block';
        document.getElementById('discoverButtonContainer').style.display = 'none';
        document.getElementById('analyzingState').style.display = 'none';
        document.getElementById('unfollowersResults').style.display = 'none';
        document.getElementById('emptyUnfollowers').style.display = 'none';
        document.getElementById('zipFileInput').value = '';
        
        // Reset upload zone text
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.querySelector('.upload-text').textContent = 'Cliquez ou glissez votre export Instagram';
        uploadZone.querySelector('.upload-subtext').textContent = 'Fichier ZIP uniquement';
    }
};
