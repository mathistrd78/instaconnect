// unfollowers.js - Analyse des unfollowers Instagram
const unfollowers = {
    data: {
        following: [],
        followers: [],
        unfollowers: [],
        marked: new Set(),
        normalUnfollowers: new Set() // Ceux qu'on veut ignorer
    },

    init() {
        // Load saved normal unfollowers
        const saved = localStorage.getItem('normalUnfollowers');
        if (saved) {
            this.data.normalUnfollowers = new Set(JSON.parse(saved));
        }

        // Setup drag & drop
        const uploadZone = document.getElementById('uploadZone');
        
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
                this.processZipFile(files[0]);
            } else {
                alert('Veuillez déposer un fichier ZIP');
            }
        });
    },

    saveNormalUnfollowers() {
        localStorage.setItem('normalUnfollowers', JSON.stringify([...this.data.normalUnfollowers]));
    },

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.zip')) {
            alert('Veuillez sélectionner un fichier ZIP');
            return;
        }

        this.processZipFile(file);
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

            // Extract usernames
            this.data.following = followingData.relationships_following.map(item => item.title);
            this.data.followers = followersData.map(item => item.string_list_data[0].value);

            // Calculate unfollowers (exclude normal ones)
            this.data.unfollowers = this.data.following
                .filter(username => !this.data.followers.includes(username))
                .filter(username => !this.data.normalUnfollowers.has(username))
                .sort();

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

        // Update stats
        document.getElementById('followingCount').textContent = this.data.following.length;
        document.getElementById('followersCount').textContent = this.data.followers.length;
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
        
        // Group by first letter
        const grouped = {};
        this.data.unfollowers.forEach(username => {
            const firstLetter = username.charAt(0).toUpperCase();
            if (!grouped[firstLetter]) grouped[firstLetter] = [];
            grouped[firstLetter].push(username);
        });

        // Sort letters
        const letters = Object.keys(grouped).sort();

        // Render with sections
        const html = letters.map(letter => {
            const users = grouped[letter];
            const usersHtml = users.map(username => {
                const isMarked = this.data.marked.has(username);
                
                return `
                    <div class="unfollower-item ${isMarked ? 'unfollowed' : ''}" id="user-${username.replace(/[^a-zA-Z0-9]/g, '_')}">
                        <div class="unfollower-info">
                            <div class="unfollower-avatar">${username.charAt(0).toUpperCase()}</div>
                            <div class="unfollower-username">@${username}</div>
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
        // Open Instagram profile (no auto-marking)
        window.location.href = `instagram://user?username=${username}`;
        setTimeout(() => {
            window.open(`https://instagram.com/${username}`, '_blank');
        }, 500);
    },

    markAsUnfollowed(username) {
        this.data.marked.add(username);
        this.renderList();
        
        // Update counter
        const remaining = this.data.unfollowers.filter(u => !this.data.marked.has(u)).length;
        document.getElementById('unfollowersCount').textContent = remaining;
    },

    markAsNormal(username) {
        if (!confirm(`Marquer @${username} comme "unfollower normal" ?\nCe profil n'apparaîtra plus dans les prochaines analyses.`)) {
            return;
        }

        this.data.normalUnfollowers.add(username);
        this.saveNormalUnfollowers();
        
        // Remove from current list
        this.data.unfollowers = this.data.unfollowers.filter(u => u !== username);
        
        // Update counter
        document.getElementById('unfollowersCount').textContent = this.data.unfollowers.length;
        
        // Re-render
        if (this.data.unfollowers.length === 0) {
            document.getElementById('unfollowersResults').style.display = 'none';
            document.getElementById('emptyUnfollowers').style.display = 'block';
        } else {
            this.renderList();
        }
    },

    showNormalUnfollowers() {
        if (this.data.normalUnfollowers.size === 0) {
            alert('Aucun unfollower normal enregistré');
            return;
        }

        const list = [...this.data.normalUnfollowers].sort();
        const html = `
            <div style="max-height: 60vh; overflow-y: auto;">
                ${list.map(username => `
                    <div class="unfollower-item">
                        <div class="unfollower-info">
                            <div class="unfollower-avatar">${username.charAt(0).toUpperCase()}</div>
                            <div class="unfollower-username">@${username}</div>
                        </div>
                        <button class="btn-mark" onclick="unfollowers.removeFromNormal('${username}')" style="background: #ff4757; color: white;">
                            ✕ Retirer
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        // Show in a simple modal-like overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
        overlay.innerHTML = `
            <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div style="padding: 20px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 18px;">⭐ Unfollowers normaux (${this.data.normalUnfollowers.size})</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #f8f9fa; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px;">✕</button>
                </div>
                <div style="padding: 16px; overflow-y: auto; flex: 1;">
                    ${html}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
    },

    removeFromNormal(username) {
        this.data.normalUnfollowers.delete(username);
        this.saveNormalUnfollowers();
        
        // Close and refresh the modal
        document.querySelector('body > div[style*="position: fixed"]')?.remove();
        
        // Show confirmation
        alert(`@${username} retiré des unfollowers normaux.\nIl réapparaîtra lors de la prochaine analyse.`);
    },

    reset() {
        this.data.following = [];
        this.data.followers = [];
        this.data.unfollowers = [];
        this.data.marked = new Set();
        // Keep normalUnfollowers saved

        document.querySelector('.unfollowers-header').style.display = 'block';
        document.getElementById('analyzingState').style.display = 'none';
        document.getElementById('unfollowersResults').style.display = 'none';
        document.getElementById('emptyUnfollowers').style.display = 'none';
        document.getElementById('zipFileInput').value = '';
    }
};
