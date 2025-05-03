require('dotenv').config();

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Extraction du token JWT de l'en-tête Authorization (format "Bearer token")
        const token = req.headers.authorization.split(' ')[1];
        // Décodage du token et vérification avec la clé secrète
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        // Récupération de l'ID de l'utilisateur depuis le token décodé
        const userId = decodedToken.userId; 
        // Ajout de l'ID de l'utilisateur à l'objet 'auth' dans la requête pour une utilisation ultérieure
        req.auth = {
            userId: userId
        };
        next();
    } catch (error) {
        // Si une erreur se produit (token invalide ou expiré), renvoi d'une réponse 401 Unauthorized
        res.status(401).json({ error });
    }
};