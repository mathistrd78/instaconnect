// unfollowers.js - Analyse des relations Instagram (unfollowers, fans, demandes)
const unfollowers = {
    data: {
        following: [],
        followers: [],
        unfollowers: [],
        fans: [],                    // NOUVEAU: followers qui ne me suivent pas en retour
        pendingRequests: [],         // NOUVEAU: demandes d'abonnement en attente
        marked: new Set(),
        normalUnfollowers: new Set(), // Influenceurs, marques...
        doNotFollowList: new Set(),   // Personnes à ne plus suivre
        normalCategories: {},         // Catégories des unfollowers normaux
        cancelledRequests: new Set()  // NOUVEAU: demandes annulées (localStorage)
    },
    
    currentTab: 'unfollowers', // NOUVEAU: onglet actif
    pendingFile: null,
    pendingFileAnalyse: null,

    init() {
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
        
        // NOUVEAU: Charger les demandes annulées
        const savedCancelled = localStorage.getItem('cancelledRequests');
        if (savedCancelled) {
            this.data.cancelledRequests = new Set(JSON.parse(savedCancelled));
        }
        
        // NOUVEAU: Charger les fans et pending depuis localStorage
        const savedFans = localStorage.getItem('fansData');
        if (savedFans) {
            this.data.fans = JSON.parse(savedFans);
        }
        
        const savedPending = localStorage.getItem('pendingRequestsData');
        if (savedPending) {
            this.data.pendingRequests = JSON.parse(savedPending);
        }
        
        // Update counts
        this.updateCounts();
        
        // Setup file input for analyse section
        const fileInputAnalyse = document.getElementById('zipFileInputAnalyse');
        if (fileInputAnalyse) {
            fileInputAnalyse.addEventListener('change', (e) => this.handleFileUploadAnalyse(e));
        }
        
        // Setup drag & drop for analyse section
        const uploadZoneAnalyse = document.getElementById('uploadZoneAnalyse');
        if (uploadZoneAnalyse) {
            uploadZoneAnalyse.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZoneAnalyse.classList.add('dragover');
            });

            uploadZoneAnalyse.addEventListener('dragleave', () => {
                uploadZoneAnalyse.classList.remove('dragover');
            });

            uploadZoneAnalyse.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZoneAnalyse.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].name.endsWith('.zip')) {
                    this.handleFileUploadAnalyse({target: {files: [files[0]]}});
                } else {
                    alert('Veuillez déposer un fichier ZIP');
                }
            });
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
    
    async saveUnfollowersDataToFirebase() {
        if (!authManager.currentUser) return;
        
        try {
            const userId = authManager.currentUser.uid;
            await db.collection('users').doc(userId).set({
                unfollowersData: {
                    following: this.data.following,
                    followers: this.data.followers,
                    unfollowers: this.data.unfollowers,
                    lastUpdate: new Date().toISOString()
                }
            }, { merge: true });
            console.log('✅ Unfollowers data saved to Firebase');
        } catch (error) {
            console.error('❌ Error saving unfollowers data:', error);
        }
    },
    
    async loadUnfollowersDataFromFirebase() {
        if (!authManager.currentUser) return;
        
        try {
            const userId = authManager.currentUser.uid;
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data.unfollowersData) {
                    this.data.following = data.unfollowersData.following || [];
                    this.data.followers = data.unfollowersData.followers || [];
                    this.data.unfollowers = data.unfollowersData.unfollowers || [];
                    
                    // Update display (stats cards removed from UI)
                    // document.getElementById('followersCount').textContent = this.data.followers.length;
                    // document.getElementById('followingCount').textContent = this.data.following.length;
                    // document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
                    
                    // Show appropriate section
                    if (this.data.unfollowers.length === 0) {
                        document.getElementById('unfollowersResults').style.display = 'none';
                        document.getElementById('emptyUnfollowers').style.display = 'block';
                        document.getElementById('emptyUnfollowers').querySelector('div:nth-child(2)').textContent = 'Aucun unfollower !';
                        document.getElementById('emptyUnfollowers').querySelector('div:nth-child(3)').textContent = 'Tout le monde que vous suivez vous suit en retour';
                    } else {
                        document.getElementById('unfollowersResults').style.display = 'block';
                        document.getElementById('emptyUnfollowers').style.display = 'none';
                        this.renderList();
                    }
                    
                    console.log('✅ Unfollowers data loaded from Firebase');
                }
            }
        } catch (error) {
            console.error('❌ Error loading unfollowers data:', error);
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
    
    handleFileUploadAnalyse(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.zip')) {
            alert('Veuillez sélectionner un fichier ZIP');
            return;
        }

        // Store file and show analyse button
        this.pendingFileAnalyse = file;
        document.getElementById('analyseButtonContainer').style.display = 'block';
        
        // Update upload zone text
        const uploadZone = document.getElementById('uploadZoneAnalyse');
        uploadZone.querySelector('.upload-text').textContent = '✅ Fichier chargé : ' + file.name;
        uploadZone.querySelector('.upload-subtext').textContent = 'Cliquez sur "Créer les fiches" pour continuer';
    },
    
    async analyzeFileForContacts() {
        if (!this.pendingFileAnalyse) return;
        
        await this.processZipFileForContacts(this.pendingFileAnalyse);
    },
    
    async processZipFileForContacts(file) {
        // Show progress
        document.getElementById('analyseProgress').style.display = 'block';
        document.getElementById('analyseResults').style.display = 'none';
        document.getElementById('analyseProgressText').textContent = 'Extraction du fichier ZIP...';

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
            let pendingFile = null; // NOUVEAU

            contents.forEach((relativePath, zipEntry) => {
                if (relativePath.includes('following.json')) {
                    followingFile = zipEntry;
                } else if (relativePath.includes('followers_1.json')) {
                    followersFile = zipEntry;
                } else if (relativePath.includes('pending_follow_requests.json')) {
                    pendingFile = zipEntry; // NOUVEAU
                }
            });

            if (!followingFile || !followersFile) {
                throw new Error('Fichiers following.json ou followers_1.json introuvables dans le ZIP');
            }

            document.getElementById('analyseProgressText').textContent = 'Lecture des fichiers...';

            // Parse JSON files
            const followingText = await followingFile.async('text');
            const followersText = await followersFile.async('text');

            const followingData = JSON.parse(followingText);
            const followersData = JSON.parse(followersText);
            
            // NOUVEAU: Parser les demandes en attente
            let pendingData = null;
            if (pendingFile) {
                const pendingText = await pendingFile.async('text');
                pendingData = JSON.parse(pendingText);
            }

            document.getElementById('analyseProgressText').textContent = 'Analyse des followers...';

            // Extract usernames
            const followingList = followingData.relationships_following.map(item => 
                item.title || item.string_list_data?.[0]?.value
            ).filter(Boolean);

            const followersList = followersData.map(item => 
                item.title || item.string_list_data?.[0]?.value
            ).filter(Boolean);

            // Create sets for faster lookup
            const followingSet = new Set(followingList);
            const followersSet = new Set(followersList);

            // Update unfollowers data (pour affichage dans l'onglet Unfollowers)
            this.data.following = followingList;
            this.data.followers = followersList;
            // Filtrer : unfollowers normaux et liste "à ne plus suivre"
            this.data.unfollowers = followingList.filter(u => 
                !followersSet.has(u) && 
                !this.data.normalUnfollowers.has(u) && 
                !this.data.doNotFollowList.has(u)
            );
            
            // NOUVEAU: Calculer les FANS (followers qui ne sont pas dans following)
            const followingSetLower = new Set(followingList.map(u => u.toLowerCase()));
            this.data.fans = followersList.filter(f => 
                !followingSetLower.has(f.toLowerCase())
            );
            console.log(`⭐ ${this.data.fans.length} fans détectés`);
            
            // NOUVEAU: Extraire les demandes en attente
            if (pendingData && pendingData.relationships_follow_requests_sent) {
                this.data.pendingRequests = pendingData.relationships_follow_requests_sent
                    .flatMap(item => item.string_list_data || [])
                    .map(entry => ({
                        username: entry.value,
                        timestamp: entry.timestamp,
                        href: entry.href
                    }))
                    // Filtrer celles annulées
                    .filter(req => !this.data.cancelledRequests.has(req.username));
                
                console.log(`⏳ ${this.data.pendingRequests.length} demandes en attente`);
            } else {
                this.data.pendingRequests = [];
            }
            
            // Sauvegarder dans localStorage
            localStorage.setItem('fansData', JSON.stringify(this.data.fans));
            localStorage.setItem('pendingRequestsData', JSON.stringify(this.data.pendingRequests));
            
            // Save unfollowers data to Firebase
            await this.saveUnfollowersDataToFirebase();
            
            // Update unfollowers display (stats cards removed from UI)
            // document.getElementById('followersCount').textContent = followersList.length;
            // document.getElementById('followingCount').textContent = followingList.length;
            // document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
            
            // Update unfollowers count in banner
            const bannerCount = document.getElementById('unfollowersCountBanner');
            if (bannerCount) {
                bannerCount.textContent = this.data.unfollowers.length;
            }
            
            // Show unfollowers section
            if (this.data.unfollowers.length === 0) {
                document.getElementById('unfollowersResults').style.display = 'none';
                document.getElementById('emptyUnfollowers').style.display = 'block';
                document.getElementById('emptyUnfollowers').querySelector('div:nth-child(2)').textContent = 'Aucun unfollower !';
                document.getElementById('emptyUnfollowers').querySelector('div:nth-child(3)').textContent = 'Tout le monde que vous suivez vous suit en retour';
            } else {
                document.getElementById('unfollowersResults').style.display = 'block';
                document.getElementById('emptyUnfollowers').style.display = 'none';
                this.renderList();
            }

            document.getElementById('analyseProgressText').textContent = 'Identification des followers mutuels...';

            // Find mutual followers (people who follow you AND you follow them)
            const mutualFollowers = followingList.filter(username => followersSet.has(username));

            // Exclude normal unfollowers
            const mutualFollowersFiltered = mutualFollowers.filter(username => 
                !this.data.normalUnfollowers.has(username)
            );

            // NOUVEAU: Vérifier et supprimer les contacts qui ne sont plus followers
            document.getElementById('analyseProgressText').textContent = 'Vérification des contacts existants...';
            const deletedResult = await this.cleanupContactsNotFollowingDuringAnalyse(followersList);
            const deletedCount = deletedResult.count;
            const deletedNames = deletedResult.names;

            document.getElementById('analyseProgressText').textContent = 'Création des fiches contacts...';

            // Create contact cards
            let created = 0;
            let skipped = 0;
            let alreadyExists = 0;

            for (const username of mutualFollowersFiltered) {
                // Check if contact already exists (by Instagram username)
                const existingContact = app.dataStore.contacts.find(c => 
                    c.instagram.toLowerCase().replace('@', '') === username.toLowerCase()
                );

                if (existingContact) {
                    alreadyExists++;
                    continue;
                }

                // Check if in "do not follow" list
                if (this.data.doNotFollowList.has(username)) {
                    skipped++;
                    continue;
                }

                // Create new contact
                const newContact = {
                    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                    firstName: '@' + username,
                    instagram: '@' + username,
                    relationType: '',
                    meetingPlace: '',
                    discussionStatus: '',
                    gender: '',
                    profession: '',
                    location: '',
                    age: '',
                    phone: '',
                    interests: '',
                    notes: '',
                    dateAdded: new Date().toISOString()
                };

                app.dataStore.contacts.push(newContact);
                created++;
                
                // Update progress every 10 contacts
                if (created % 10 === 0) {
                    document.getElementById('analyseProgressText').textContent = 
                        `Création des fiches contacts... (${created} créées)`;
                }
            }

            // Save to Firebase (with metadata since we might have many new contacts)
            document.getElementById('analyseProgressText').textContent = 'Sauvegarde...';
            await app.dataStore.save(null, true); // null = all contacts, true = save metadata too

            // Update counts
            this.updateCounts();

            // Show results
            document.getElementById('analyseProgress').style.display = 'none';
            document.getElementById('analyseResults').style.display = 'block';

            const statsHTML = `
                <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #28a745; margin-bottom: 4px;">${created}</div>
                    <div style="font-size: 13px; color: #6c757d;">Contacts créés</div>
                </div>
                <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #ffc107; margin-bottom: 4px;">${alreadyExists}</div>
                    <div style="font-size: 13px; color: #6c757d;">Déjà existants</div>
                </div>
                ${deletedCount > 0 ? `
                <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #dc3545; margin-bottom: 4px;">${deletedCount}</div>
                    <div style="font-size: 13px; color: #6c757d;">Contacts supprimés</div>
                </div>
                ` : ''}
                <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #ff7675; margin-bottom: 4px;">${this.data.unfollowers.length}</div>
                    <div style="font-size: 13px; color: #6c757d;">Unfollowers</div>
                </div>
                <div style="background: white; padding: 16px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #007bff; margin-bottom: 4px;">${mutualFollowersFiltered.length}</div>
                    <div style="font-size: 13px; color: #6c757d;">Followers mutuels</div>
                </div>
            `;

            document.getElementById('analyseStats').innerHTML = statsHTML;

            // Render contacts and stats
            contacts.render();
            stats.render();

            // Afficher l'alerte si des contacts ont été supprimés
            if (deletedCount > 0) {
                setTimeout(() => {
                    alert(`⚠️ ${deletedCount} contact(s) supprimé(s) automatiquement car ils ne vous suivent plus :\n\n${deletedNames.join('\n')}\n\nCes personnes vous ont unfollow ou supprimé de leurs abonnés.`);
                }, 500); // Petit délai pour laisser l'UI se mettre à jour
            }

            // Reset file
            this.pendingFileAnalyse = null;
            document.getElementById('zipFileInputAnalyse').value = '';
            document.getElementById('analyseButtonContainer').style.display = 'none';
            
            // Reset upload zone
            const uploadZone = document.getElementById('uploadZoneAnalyse');
            uploadZone.querySelector('.upload-text').textContent = 'Sélectionnez votre export Instagram';
            uploadZone.querySelector('.upload-subtext').textContent = 'Fichier ZIP uniquement';

        } catch (error) {
            console.error('Error processing ZIP for contacts:', error);
            alert('Erreur lors de l\'analyse : ' + error.message);
            
            document.getElementById('analyseProgress').style.display = 'none';
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

            // Calculate unfollowers with dates (exclude normal ones AND unfollowed ones)
            this.data.unfollowers = followingList
                .filter(item => !this.data.followers.includes(item.username))
                .filter(item => !this.data.normalUnfollowers.has(item.username))
                .filter(item => !this.data.doNotFollowList.has(item.username))
                .map(item => ({
                    username: item.username,
                    timestamp: item.timestamp
                }))
                .sort((a, b) => a.username.localeCompare(b.username));
            
            console.log('👤 First unfollower with timestamp:', this.data.unfollowers[0]);

            // Reset marked for new analysis
            this.data.marked = new Set();

            // NOUVEAU: Vérifier et supprimer les contacts qui ne sont plus followers
            await this.cleanupContactsNotFollowing();

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

    async cleanupContactsNotFollowing() {
        if (typeof app === 'undefined' || !app.dataStore || !app.dataStore.contacts) {
            console.log('⚠️ No contacts to cleanup');
            return;
        }

        const contactsToDelete = [];
        const followerUsernames = this.data.followers.map(f => f.toLowerCase());

        console.log('🔍 Checking contacts against followers list...');

        // Parcourir tous les contacts
        for (const contact of app.dataStore.contacts) {
            const instagramUsername = contact.instagram.toLowerCase().replace('@', '');
            
            // Vérifier si ce contact est toujours dans les followers
            if (!followerUsernames.includes(instagramUsername)) {
                console.log(`❌ Contact @${instagramUsername} is no longer following you - marking for deletion`);
                contactsToDelete.push(contact);
            }
        }

        // Supprimer les contacts qui ne sont plus followers
        if (contactsToDelete.length > 0) {
            console.log(`🗑️ Deleting ${contactsToDelete.length} contact(s) who no longer follow you...`);
            
            for (const contact of contactsToDelete) {
                const index = app.dataStore.contacts.findIndex(c => c.id === contact.id);
                if (index !== -1) {
                    app.dataStore.contacts.splice(index, 1);
                    await app.dataStore.deleteContact(contact.id);
                }
            }

            // Rafraîchir l'affichage
            if (typeof contacts !== 'undefined' && contacts.render) {
                contacts.render();
            }
            if (typeof stats !== 'undefined' && stats.render) {
                stats.render();
            }

            // Notifier l'utilisateur
            const names = contactsToDelete.map(c => c.firstName).join(', ');
            alert(`⚠️ ${contactsToDelete.length} contact(s) supprimé(s) automatiquement car ils ne vous suivent plus :\n\n${names}\n\nCes personnes vous ont unfollow ou supprimé de leurs abonnés.`);
        } else {
            console.log('✅ All contacts are still following you');
        }
    },

    async cleanupContactsNotFollowingDuringAnalyse(followersList) {
        if (typeof app === 'undefined' || !app.dataStore || !app.dataStore.contacts) {
            console.log('⚠️ No contacts to cleanup');
            return { count: 0, names: [] };
        }

        const contactsToDelete = [];
        const followerUsernames = followersList.map(f => f.toLowerCase());

        console.log('🔍 Checking contacts against followers list...');

        // Parcourir tous les contacts
        for (const contact of app.dataStore.contacts) {
            const instagramUsername = contact.instagram.toLowerCase().replace('@', '');
            
            // Vérifier si ce contact est toujours dans les followers
            if (!followerUsernames.includes(instagramUsername)) {
                console.log(`❌ Contact @${instagramUsername} is no longer following you - marking for deletion`);
                contactsToDelete.push(contact);
            }
        }

        // Supprimer les contacts qui ne sont plus followers
        if (contactsToDelete.length > 0) {
            console.log(`🗑️ Deleting ${contactsToDelete.length} contact(s) who no longer follow you...`);
            
            const deletedNames = contactsToDelete.map(c => `@${c.instagramUsername}`);
            
            for (const contact of contactsToDelete) {
                const index = app.dataStore.contacts.findIndex(c => c.id === contact.id);
                if (index !== -1) {
                    app.dataStore.contacts.splice(index, 1);
                    await app.dataStore.deleteContact(contact.id);
                }
            }

            console.log(`✅ ${contactsToDelete.length} contact(s) deleted`);
            return { count: contactsToDelete.length, names: deletedNames };
        } else {
            console.log('✅ All contacts are still following you');
            return { count: 0, names: [] };
        }
    },

    displayResults() {
        // Hide analyzing
        document.getElementById('analyzingState').style.display = 'none';

        // Update stats - stats cards removed from UI
        // document.getElementById('followersCount').textContent = this.data.followers.length;
        // document.getElementById('followingCount').textContent = this.data.following.length;
        // document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
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
        // Update counter in banner
        const bannerCount = document.getElementById('unfollowersCountBanner');
        if (bannerCount) {
            bannerCount.textContent = this.data.unfollowers.length;
        }
        
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
                            <a href="https://instagram.com/${username}" target="_blank" rel="noopener noreferrer" class="unfollower-username-link">@${username}</a>
                            ${dateStr}
                        </div>
                        <div class="unfollower-actions">
                            ${!isMarked ? `
                                <button class="btn-emoji-normal" onclick="unfollowers.markAsNormal('${username}')" title="Marquer comme normal">
                                    ✅
                                </button>
                                <button class="btn-emoji-unfollow" onclick="unfollowers.markAsUnfollowed('${username}')" title="Marquer comme unfollowed">
                                    ❌
                                </button>
                            ` : `
                                <button class="btn-unfollow" disabled>✓ Fait</button>
                            `}
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

    async markAsUnfollowed(username) {
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
        
        // NOUVEAU: Vérifier si un contact existe avec ce pseudo Instagram et le supprimer
        const contactToDelete = app.dataStore.contacts.find(c => 
            c.instagram.toLowerCase().replace('@', '') === username.toLowerCase()
        );
        
        if (contactToDelete) {
            console.log(`🗑️ Deleting contact for @${username} from contacts list`);
            const index = app.dataStore.contacts.findIndex(c => c.id === contactToDelete.id);
            if (index !== -1) {
                app.dataStore.contacts.splice(index, 1);
                await app.dataStore.deleteContact(contactToDelete.id);
            }
            
            // Rafraîchir l'affichage des contacts si on est sur cette page
            if (app.currentSection === 'contacts' && typeof contacts !== 'undefined' && contacts.render) {
                contacts.render();
            }
            
            // Rafraîchir les stats
            if (typeof stats !== 'undefined' && stats.render) {
                stats.render();
            }
        }
        
        // NOUVEAU: Diminuer le compteur de following (stats cards removed from UI)
        // const followingCountEl = document.getElementById('followingCount');
        // if (followingCountEl) {
        //     const currentFollowing = parseInt(followingCountEl.textContent);
        //     followingCountEl.textContent = currentFollowing - 1;
        // }
        
        // Update unfollowers counter (stats cards removed from UI)
        // document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
        // Update counts (including doNotFollowCount)
        this.updateCounts();
        
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
        
        // Update counter (stats cards removed from UI)
        // document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
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
        
        // Show modal with search and horizontal scroll filters
        const overlay = document.createElement('div');
        overlay.id = 'normalUnfollowersModal';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        overlay.innerHTML = `
            <div class="modal-content-unfollowers" style="background: white; border-radius: 16px; max-width: 600px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="modal-header-unfollowers" style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 18px;">Unfollowers normaux (${this.data.normalUnfollowers.size})</h3>
                        <button onclick="document.getElementById('normalUnfollowersModal').remove()" class="modal-close-btn" style="background: #f8f9fa; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">✕</button>
                    </div>
                    <input type="text" id="searchNormal" placeholder="🔍 Rechercher..." class="modal-search-input"
                           style="width: 100%; padding: 10px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 14px; box-sizing: border-box; margin-bottom: 12px;"
                           oninput="unfollowers.filterNormalBySearch(this.value)">
                    <div class="modal-filters" style="display: flex; gap: 8px; overflow-x: auto; white-space: nowrap; padding-bottom: 8px; -webkit-overflow-scrolling: touch;">
                        <button onclick="unfollowers.filterNormalByCategory('all')" id="filterAll" class="modal-filter-btn" style="background: #E1306C; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            Tous
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('disabled')" id="filterDisabled" class="modal-filter-btn" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            🚫 Désactivés
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('celebrity')" id="filterCelebrity" class="modal-filter-btn" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            ⭐ Personnalités
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('business')" id="filterBusiness" class="modal-filter-btn" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            💼 Marques/Pro
                        </button>
                        <button onclick="unfollowers.filterNormalByCategory('uncategorized')" id="filterUncategorized" class="modal-filter-btn" style="background: #f8f9fa; color: #495057; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 14px; flex-shrink: 0;">
                            Sans catégorie
                        </button>
                    </div>
                </div>
                <div id="normalUnfollowersList" class="modal-list-content" style="padding: 16px; overflow-y: auto; flex: 1;">
                    ${this.renderNormalList(list, 'all', '')}
                </div>
            </div>
        `;

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
            
            // Filter by search - cherche au DÉBUT uniquement
            const searchMatch = username.toLowerCase().startsWith(searchTerm.toLowerCase());
            
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
                            <a href="https://instagram.com/${username}" target="_blank" rel="noopener noreferrer" class="unfollower-username-link" style="color: #E1306C; text-decoration: none;">@${username}</a>
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
    
    filterNormalByCategory(category) {
        // Update button styles
        ['All', 'Disabled', 'Celebrity', 'Business', 'Uncategorized'].forEach(cat => {
            const btn = document.getElementById(`filter${cat}`);
            if (btn) {
                if (cat.toLowerCase() === category || (cat === 'All' && category === 'all')) {
                    btn.style.background = '#E1306C';
                    btn.style.color = 'white';
                } else {
                    btn.style.background = '#f8f9fa';
                    btn.style.color = '#495057';
                }
            }
        });
        
        // Get current search
        const searchInput = document.getElementById('searchNormal');
        const searchTerm = searchInput ? searchInput.value : '';
        
        // Re-render with both filters
        const list = [...this.data.normalUnfollowers].sort();
        const listContainer = document.getElementById('normalUnfollowersList');
        if (listContainer) {
            listContainer.innerHTML = this.renderNormalList(list, category, searchTerm);
        }
    },
    
    filterNormalBySearch(searchTerm) {
        // Get current category filter
        const buttons = ['filterAll', 'filterDisabled', 'filterCelebrity', 'filterBusiness', 'filterUncategorized'];
        let currentFilter = 'all';
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn && btn.style.background === 'rgb(225, 48, 108)') { // #E1306C en RGB
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
    
    refreshNormalList() {
        // Get current filters
        const buttons = ['filterAll', 'filterDisabled', 'filterCelebrity', 'filterBusiness', 'filterUncategorized'];
        let currentFilter = 'all';
        
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn && btn.style.background === 'rgb(225, 48, 108)') { // #E1306C en RGB
                currentFilter = btnId.replace('filter', '').toLowerCase();
            }
        });
        
        const searchInput = document.getElementById('searchNormal');
        const searchTerm = searchInput ? searchInput.value : '';
        
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
        
        // Show in overlay modal with search
        const overlay = document.createElement('div');
        overlay.id = 'doNotFollowModal';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        overlay.innerHTML = `
            <div class="modal-content-unfollowers" style="background: white; border-radius: 16px; max-width: 500px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="modal-header-unfollowers" style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 18px;">Utilisateurs à ne plus suivre (${this.data.doNotFollowList.size})</h3>
                        <button onclick="document.getElementById('doNotFollowModal').remove()" class="modal-close-btn" style="background: #f8f9fa; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">✕</button>
                    </div>
                    <input type="text" id="searchDoNotFollow" placeholder="🔍 Rechercher..." class="modal-search-input"
                           style="width: 100%; padding: 10px; border: 1px solid #e9ecef; border-radius: 8px; font-size: 14px; box-sizing: border-box;"
                           oninput="unfollowers.filterDoNotFollowList(this.value)">
                </div>
                <div id="doNotFollowList" class="modal-list-content" style="padding: 16px; overflow-y: auto; flex: 1;">
                    ${this.renderDoNotFollowList(list, '')}
                </div>
            </div>
        `;

        document.getElementById('doNotFollowModal')?.remove();
        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    },
    
    renderDoNotFollowList(list, searchTerm) {
        const filteredList = list.filter(username => 
            username.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        
        if (filteredList.length === 0) {
            return '<div style="text-align: center; color: #6c757d; padding: 20px;">Aucun résultat</div>';
        }
        
        return filteredList.map(username => `
            <div class="unfollower-item">
                <div class="unfollower-info">
                    <div class="unfollower-username">
                        <a href="https://instagram.com/${username}" target="_blank" rel="noopener noreferrer" class="unfollower-username-link" style="color: #E1306C; text-decoration: none;">@${username}</a>
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

    removeFromDoNotFollow(username) {
        this.data.doNotFollowList.delete(username);
        this.saveDoNotFollowList();
        
        // Close modal
        document.querySelector('body > div[style*="position: fixed"]')?.remove();
        
        // Refresh the list and counts
        this.renderList();
        this.updateCounts();
        
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
    },
    
    // ==========================================
    // NOUVELLES FONCTIONS POUR RELATIONS
    // ==========================================
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.relation-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        // Hide all contents
        document.querySelectorAll('.relation-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Show selected content
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
        
        // Render
        if (tabName === 'fans') {
            this.renderFans();
        } else if (tabName === 'pending') {
            this.renderPendingRequests();
        }
    },
    
    renderFans() {
        const container = document.getElementById('fansListContainer');
        if (!container) return;
        
        if (this.data.fans.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 16px;">⭐</div>
                    <div style="font-size: 18px; font-weight: 600; color: #212529; margin-bottom: 8px;">Aucun fan</div>
                    <div style="color: #6c757d;">Toutes les personnes qui vous suivent, vous les suivez en retour !</div>
                </div>
            `;
            return;
        }
        
        // Grouper par lettre
        const grouped = {};
        this.data.fans.forEach(username => {
            const letter = username.charAt(0).toUpperCase();
            if (!grouped[letter]) grouped[letter] = [];
            grouped[letter].push(username);
        });
        
        // Trier les lettres
        const letters = Object.keys(grouped).sort();
        
        let html = `
            <!-- Bandeau bleu avec compteur -->
            <div style="padding: 16px 20px; background: #e3f2fd; border-radius: 8px; margin: 16px 0 16px 0;">
                <div style="font-size: 24px; font-weight: 700; color: #1976d2;">${this.data.fans.length} Fans</div>
                <div style="font-size: 13px; color: #6c757d; margin-top: 4px;">Vous suivent mais vous ne les suivez pas</div>
            </div>
            
            <div class="unfollowers-list">
                <div class="unfollowers-list-header">
                    <span>Liste des fans</span>
                </div>
                <div style="padding: 12px;">
        `;
        
        letters.forEach((letter, index) => {
            // Première divider sans margin en haut
            const firstClass = index === 0 ? ' first-divider' : '';
            html += `<div class="letter-divider${firstClass}">${letter}</div>`;
            grouped[letter].forEach(username => {
                html += `
                    <div class="fan-card">
                        <a href="https://www.instagram.com/${username}" target="_blank" style="text-decoration: none; color: #E1306C; font-weight: 600; font-size: 15px;">
                            @${username}
                        </a>
                    </div>
                `;
            });
        });
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    renderPendingRequests() {
        const container = document.getElementById('pendingListContainer');
        if (!container) return;
        
        if (this.data.pendingRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
                    <div style="font-size: 18px; font-weight: 600; color: #212529; margin-bottom: 8px;">Aucune demande en attente</div>
                    <div style="color: #6c757d;">Vous n'avez pas de demandes d'abonnement en attente</div>
                </div>
            `;
            return;
        }
        
        // Grouper par lettre
        const grouped = {};
        this.data.pendingRequests.forEach(req => {
            const letter = req.username.charAt(0).toUpperCase();
            if (!grouped[letter]) grouped[letter] = [];
            grouped[letter].push(req);
        });
        
        // Trier les lettres
        const letters = Object.keys(grouped).sort();
        
        let html = `
            <!-- Bandeau jaune avec compteur -->
            <div style="padding: 16px 20px; background: #e3f2fd; border-radius: 8px; margin: 16px 0 16px 0;">
                <div style="font-size: 24px; font-weight: 700; color: #1976d2;">${this.data.pendingRequests.length} Demandes en attente</div>
                <div style="font-size: 13px; color: #6c757d; margin-top: 4px;">Comptes privés dont vous avez fait la demande</div>
            </div>
            
            <div class="unfollowers-list">
                <div class="unfollowers-list-header">
                    <span>Liste des demandes</span>
                </div>
                <div style="padding: 12px;">
        `;
        
        letters.forEach((letter, index) => {
            // Première divider sans margin en haut
            const firstClass = index === 0 ? ' first-divider' : '';
            html += `<div class="letter-divider${firstClass}">${letter}</div>`;
            grouped[letter].forEach(req => {
                html += `
                    <div class="fan-card" style="display: flex; justify-content: space-between; align-items: center;">
                        <a href="https://www.instagram.com/${req.username}" target="_blank" style="text-decoration: none; color: #E1306C; font-weight: 600; font-size: 15px;">
                            @${req.username}
                        </a>
                        <button class="btn-mark" style="background: #6c757d; color: white; font-size: 12px; padding: 6px 12px; border-radius: 6px;" onclick="unfollowers.cancelPendingRequest('${req.username}')">
                            Demande annulée
                        </button>
                    </div>
                `;
            });
        });
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    cancelPendingRequest(username) {
        // Ajouter aux annulées
        this.data.cancelledRequests.add(username);
        
        // Retirer des pending
        this.data.pendingRequests = this.data.pendingRequests.filter(req => req.username !== username);
        
        // Sauvegarder
        localStorage.setItem('cancelledRequests', JSON.stringify([...this.data.cancelledRequests]));
        localStorage.setItem('pendingRequestsData', JSON.stringify(this.data.pendingRequests));
        
        // Re-render
        this.renderPendingRequests();
        
        console.log(`✅ Demande pour @${username} marquée comme annulée`);
    }
};
