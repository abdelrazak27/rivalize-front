const fs = require('fs');
const path = require('path');

// Assurez-vous de remplacer 'path/to/your/jsonfile.json' avec le chemin réel de votre fichier JSON
const jsonFilePath = path.join(__dirname, './france.json');
const sortedJsonFilePath = path.join(__dirname, 'sortedFrance.json');

// Lecture du fichier JSON
fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Erreur lors de la lecture du fichier:', err);
        return;
    }

    // Parse le JSON
    let citiesArray;
    try {
        citiesArray = JSON.parse(data);
    } catch (parseErr) {
        console.error('Erreur lors du parsing du JSON:', parseErr);
        return;
    }

    // Tri des données par Nom_commune
    const sortedCities = citiesArray.sort((a, b) => a.Nom_commune.localeCompare(b.Nom_commune));

    // Écriture des données triées dans un nouveau fichier
    fs.writeFile(sortedJsonFilePath, JSON.stringify(sortedCities, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
            console.error('Erreur lors de l\'écriture du fichier:', writeErr);
            return;
        }

        console.log('Fichier trié écrit avec succès.');
    });
});
