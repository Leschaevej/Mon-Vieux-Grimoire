const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Fonction pour l'inscription des utilisateurs
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)  // Chiffrement du mot de passe avec bcrypt
        .then(hash => {
            const user = new User({
                email: req.body.email,
                password: hash  // Le mot de passe est stocké sous forme de hash, jamais en clair
            });
            user.save()  // Sauvegarde du nouvel utilisateur dans la base de données
                .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

// Fonction pour la connexion des utilisateurs
exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })  // Recherche de l'utilisateur par son email
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Utilisateur non trouvé' });
            }
            bcrypt.compare(req.body.password, user.password)  // Vérification du mot de passe avec bcrypt
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Mot de passe incorrect' });
                    }
                    const token = jwt.sign(  // Génération du token JWT
                        { userId: user._id },
                        process.env.JWT_SECRET,
                        { expiresIn: '24h' }  // Le token expire après 24 heures
                    );
                    res.status(200).json({
                        userId: user._id,
                        token: token  // Le Frontend utilise ce token pour accéder aux routes sécurisées
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};