const http = require('http');
const app = require('./app');

// Fonction pour normaliser le port (le convertir en nombre ou valider un nom de pipe)
const normalizePort = val => {
    const port = parseInt(val, 10);

    // Si ce n’est pas un nombre, on retourne la valeur telle quelle (cas d’un nom de pipe)
    if (isNaN(port)) {
        return val;
    }

    // Si le port est un nombre positif, on le retourne
    if (port >= 0) {
        return port;
    }

    // Sinon, on retourne false (valeur invalide)
    return false;
};

// On définit le port d'écoute du serveur (variable d'environnement ou 3000 par défaut)
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port); // On associe ce port à notre app Express

// Fonction de gestion des erreurs potentielles lors du lancement du serveur
const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;

    // Gestion des cas d'erreurs spécifiques
    switch (error.code) {
        case 'EACCES': // Privilèges insuffisants pour accéder au port
            console.error(bind + ' requires elevated privileges.');
            process.exit(1); // Arrêt du processus
            break;
        case 'EADDRINUSE': // Le port est déjà utilisé
            console.error(bind + ' is already in use.');
            process.exit(1); // Arrêt du processus
            break;
        default:
            throw error; // Autres erreurs
    }
};

// Création du serveur HTTP avec notre application Express
const server = http.createServer(app);

// Écoute des événements 'error' pour gérer les erreurs de démarrage
server.on('error', errorHandler);

// Événement 'listening' déclenché lorsque le serveur démarre correctement
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Listening on ' + bind); // Affiche sur quel port le serveur écoute
});

// Le serveur commence à écouter les requêtes sur le port défini
server.listen(port);