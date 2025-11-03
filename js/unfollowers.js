// unfollowers.js - Analyse des unfollowers Instagram
const unfollowers = {
    data: {
        following: [],
        followers: [],
        unfollowers: [],
        marked: new Set()
    },

    init() {
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

            // Calculate unfollowers
            this.data.unfollowers = this.data.following.filter(
                username => !this.data.followers.includes(username)
            ).sort();

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
        
        const html = this.data.unfollowers.map(username => {
            const isMarked = this.data.marked.has(username);
            
            return `
                <div class="unfollower-item ${isMarked ? 'unfollowed' : ''}" id="user-${username.replace(/[^a-zA-Z0-9]/g, '_')}">
                    <div class="unfollower-info">
                        <div class="unfollower-avatar">${username.charAt(0).toUpperCase()}</div>
                        <div class="unfollower-username">@${username}</div>
                    </div>
                    <div class="unfollower-actions">
                        <button class="btn-unfollow" onclick="unfollowers.openInstagram('${username}')" ${isMarked ? 'disabled' : ''}>
                            ${isMarked ? '✓ Fait' : '🔗 Unfollow'}
                        </button>
                        ${!isMarked ? `<button class="btn-mark" onclick="unfollowers.markAsUnfollowed('${username}')">✓</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        list.innerHTML = html;
    },

    openInstagram(username) {
        // Open Instagram profile
        window.location.href = `instagram://user?username=${username}`;
        setTimeout(() => {
            window.open(`https://instagram.com/${username}`, '_blank');
        }, 500);

        // Auto-mark as unfollowed after 2 seconds
        setTimeout(() => {
            this.markAsUnfollowed(username);
        }, 2000);
    },

    markAsUnfollowed(username) {
        this.data.marked.add(username);
        this.renderList();
        
        // Update counter
        const remaining = this.data.unfollowers.length - this.data.marked.size;
        document.getElementById('unfollowersCount').textContent = remaining;
    },

    reset() {
        this.data = {
            following: [],
            followers: [],
            unfollowers: [],
            marked: new Set()
        };

        document.querySelector('.unfollowers-header').style.display = 'block';
        document.getElementById('analyzingState').style.display = 'none';
        document.getElementById('unfollowersResults').style.display = 'none';
        document.getElementById('emptyUnfollowers').style.display = 'none';
        document.getElementById('zipFileInput').value = '';
    }
};
