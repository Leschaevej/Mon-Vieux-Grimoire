const Book = require('../models/book');
const fs = require('fs');

// Fonction pour créer un livre
exports.createBook = (req, res, next) => {
    // Récupération des données du livre envoyées dans le corps de la requête
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;  // Suppression de l'ID existant si présent
    delete bookObject._userId;  // Suppression de l'ID utilisateur si présent
    
    // Création d'un nouvel objet livre
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,  // L'utilisateur qui a ajouté le livre
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // URL de l'image envoyée
    });
  
    // Enregistrement du livre dans la base de données
    book.save()
        .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
        .catch(error => { res.status(400).json( { error })})
};

// Fonction pour récupérer un livre spécifique
exports.getOneBook = (req, res, next) => {
    // Recherche du livre par son ID
    Book.findOne({
        _id: req.params.id
    }).then(
        (book) => {
        res.status(200).json(book);  // Renvoi des informations du livre
        }
    ).catch(
        (error) => {
        res.status(404).json({
            error: error
        });
    });
};

// Fonction pour modifier un livre
exports.modifyBook = (req, res, next) => {
    // Si une nouvelle image est envoyée, on met à jour l'URL de l'image
    const bookObject = req.file
        ? {
            ...JSON.parse(req.body.book),  // On récupère les données du livre envoyées dans le corps de la requête
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`  // URL de la nouvelle image
        }
        : { ...req.body };  // Si pas de nouvelle image, on garde les données envoyées sans la modification de l'image

    delete bookObject._userId;

    // Vérification des champs obligatoires
    const requiredFields = ['title', 'author', 'genre', 'year'];
    for (const field of requiredFields) {
        if (!bookObject[field]) {
            return res.status(400).json({ message: `Le champ '${field}' est requis.` });
        }
    }

    // Recherche du livre à modifier dans la base de données
    Book.findOne({ _id: req.params.id })
        .then(book => {
            // Vérification que l'utilisateur est bien le propriétaire du livre
            if (book.userId != req.auth.userId) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // Si une nouvelle image a été envoyée, on supprime l'ancienne image du serveur
            if (req.file) {
                const oldFilename = book.imageUrl.split('/images/')[1];  // On récupère le nom de l'ancienne image
                fs.unlink(`images/${oldFilename}`, (err) => {  // Suppression du fichier image
                    if (err) console.error('Erreur lors de la suppression de l’ancienne image :', err);
                });
            }

            // Mise à jour du livre dans la base de données
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id }, { runValidators: true })  // Mise à jour avec les nouvelles données
                .then(() => res.status(200).json({ message: 'Objet modifié!' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};

// Fonction pour supprimer un livre
exports.deleteBook = (req, res, next) => {
    // Recherche du livre à supprimer
    Book.findOne({ _id: req.params.id})
        .then(book => {
            // Vérification que l'utilisateur est bien le propriétaire du livre
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                // Suppression de l'image associée au livre
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {  // Suppression du fichier image
                    // Suppression du livre dans la base de données
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });  // Erreur interne serveur
        });
};

// Fonction pour récupérer tous les livres
exports.getAllBook = (req, res, next) => {
    // Récupération de tous les livres
    Book.find().then(
        (books) => {
            res.status(200).json(books);  // Renvoi de tous les livres
        }
    ).catch(
        (error) => {
        res.status(400).json({
            error: error
        });
        }
    );
};

// Fonction pour récupérer les livres les mieux notés
exports.getBestRatedBooks = (req, res, next) => {
    // Recherche des livres triés par note moyenne
    Book.find()
        .sort({ averageRating: -1 })  // Trie par note décroissante
        .limit(5)
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(400).json({ error }));
};

// Fonction pour attribuer une note à un livre
exports.rateBook = async (req, res) => {
    try {
        // Recherche du livre à noter
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Livre non trouvé' });

        const { userId, rating } = req.body;  // Récupération des informations de la note (utilisateur et note)

        // Vérification si l'utilisateur a déjà noté ce livre
        const existingRating = book.ratings.find(r => r.userId === userId);
        if (existingRating) {
            existingRating.grade = rating;  // Si déjà noté, on met à jour la note
        } else {
            book.ratings.push({ userId, grade: rating });  // Sinon, on ajoute une nouvelle note
        }

        // Recalcul de la note moyenne du livre
        const sum = book.ratings.reduce((acc, r) => acc + r.grade, 0);
        book.averageRating = sum / book.ratings.length;

        // Sauvegarde du livre mis à jour
        const updatedBook = await book.save();

        res.status(200).json(updatedBook);  // Renvoi du livre mis à jour
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
};