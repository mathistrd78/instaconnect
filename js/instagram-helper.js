// instagram-helper.js - Helper pour ouvrir Instagram correctement

/**
 * Génère le lien Instagram optimal selon le contexte
 * - Sur PWA iOS/Android : utilise instagram:// (app native)
 * - Sur navigateur : utilise https://instagram.com
 */
function getInstagramLink(username) {
    const cleanUsername = username.replace('@', '');
    
    // Détecte si on est dans une PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    // Sur PWA, utiliser le deep link pour ouvrir l'app Instagram
    if (isPWA) {
        return `instagram://user?username=${cleanUsername}`;
    }
    
    // Sur navigateur, utiliser l'URL web
    return `https://instagram.com/${cleanUsername}`;
}

/**
 * Ouvre un profil Instagram de manière optimale
 * Essaie d'abord l'app, puis fallback sur le web
 */
function openInstagram(username, event) {
    if (event) {
        event.preventDefault();
    }
    
    const cleanUsername = username.replace('@', '');
    
    // Détecte si on est dans une PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    if (isPWA) {
        // Essayer d'ouvrir l'app Instagram
        const appUrl = `instagram://user?username=${cleanUsername}`;
        const webUrl = `https://instagram.com/${cleanUsername}`;
        
        // Tenter d'ouvrir l'app
        window.location.href = appUrl;
        
        // Fallback vers le web après 1.5s si l'app ne s'ouvre pas
        setTimeout(() => {
            window.open(webUrl, '_blank');
        }, 1500);
    } else {
        // Sur navigateur, ouvrir directement dans un nouvel onglet
        window.open(`https://instagram.com/${cleanUsername}`, '_blank', 'noopener,noreferrer');
    }
}
