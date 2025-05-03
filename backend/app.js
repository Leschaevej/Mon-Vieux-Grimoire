const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/user');

// Connexion à MongoDB via Mongoose
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'));

// Création de l'application Express
const app = express();

// Configuration du CORS pour autoriser les requêtes depuis le frontend (localhost:3001)
app.use(cors({ origin: 'http://localhost:3001', credentials: true }));

// Middleware pour parser les corps de requêtes JSON
app.use(express.json());

// Déclaration des routes de l'API
app.use('/api/books', bookRoutes); // Routes liées aux livres
app.use('/api/auth', userRoutes); // Routes liées à l'inscription et à la connexion

// Middleware pour servir les fichiers statiques (images) depuis le dossier 'images'
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
