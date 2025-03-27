"use strict"

const dayjs = require('dayjs');
const sqlite = require('sqlite3');
const express = require('express');
const app = express();
const db = new sqlite.Database('films.db', (err) => { if (err) throw err; });
function closeDB() {
    try {
        db.close();
    }
    catch (error) {
        console.log(`Impossible to close the database! ${error}`);
    }
}

//retrive the list of all films
exports.getAllFilm = () => new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM films';
    db.get(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
});

//Retrieve a film, given its “id”.
exports.getFilmById = (id) => new Promise((resolve, reject) => {
    const sql = "SELECT * FROM films WHERE id=?"
    db.get(sql, [id], (err, rows) => err ? reject(err) : resolve(rows))
});

//Create a new film, by providing all relevant information – except the “id” that will be automatically assigned by the back-end.
exports.insertFilmInDb = (title, favorite, watchdate, rating) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO films(title, favorite, watchdate, rating) VALUES(?, ?, ?, ?)";

        db.run(sql, [title, favorite, watchdate, rating], function (err) {
            if (err) {
                return reject(err);  // In caso di errore, rifiuta la Promise
            }
            resolve({ id: this.lastID, title, favorite, watchdate, rating });  // Risolvi con l'ID dell'elemento appena inserito
        });
    });
};

//Mark an existing film as favorite/unfavorite.
exports.markFilm = (id,favorite) => {
    return new Promise((resolve, reject) => {
        const updateSql = "UPDATE films SET favorite = ? WHERE id = ?";
        db.run(updateSql, [favorite, id], function (err) {
            if (err) {
                return reject(err);
            }
            if (this.changes === 0) {
                return reject({ message: "No update needed, favorite is already set to this value" });
            }
            resolve({ message: "Film updated successfully", changes: this.changes });
        });
    });
};

//Change the rating of a specific film by specifying a delta value (i.e., an amount to add or subtract to the 
//rating, such as +1 or -1). Only ratings which are not null can be changed.
exports.filmrating = (id, delta) => {
    return new Promise((resolve, reject) => {
        const deltaNum = parseInt(delta);

        // Validazione: delta deve essere -1 o 1
        if (isNaN(deltaNum) || (deltaNum !== -1 && deltaNum !== 1)) {
            return reject(new Error("Invalid rating value"));
        }

        const updateSql = "UPDATE films SET rating = rating + ? WHERE id = ? AND rating IS NOT NULL";

        // Usiamo db.get() perché RETURNING * restituisce una sola riga
        db.run(updateSql, [deltaNum, id], function (err) {
            if (err) {
                return reject(err);
            }
            if (this.changes === 0) {
                return reject(new Error("Film not found or rating is null and cannot be changed"));
            }
            resolve({ message: "Film updated successfully", changes: this.changes });
        });
    });
};


exports.deleteFilm = (id) => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM films WHERE id=?';
    db.run(sql, [id], function (err) {
        if (err) {
            return reject(err);
        }
        if (this.changes === 0) {
            return reject(new Error("Film not found"));
        }
        resolve({ message: "Film deleted successfully" });
    });
});

exports.filmFilter = (filter) => new Promise((resolve, reject) => {
    let sql='';
    let param = [];
    if (filter === "favorite") {
        const sql = "SELECT * FROM films WHERE favorite=1"
    }
    if (filter === "best") {
        const sql = "SELECT * FROM films WHERE rating>=5"
    }
    if (filter === "data") {
        const lastMonthDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        const sql = "SELECT * FROM films WHERE  watchdate >= ?"
        params.push(lastMonthDate);
    }
    if (filter === "unseen") {
        const sql = "SELECT * FROM films WHERE  watchdate IS NULL"
    }

    if (!sql) {
        return reject(new Error("Invalid filter"));
    }

    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))

});

exports.filmUpdate = (id, { title, favorite, watchdate, rating }) => {
    return new Promise((resolve, reject) => {
        // Recupera il film esistente dal database per ottenere i valori correnti
        const getFilmSql = "SELECT * FROM films WHERE id = ?";
        
        db.all(getFilmSql, [id], (err, existingFilm) => {
            if (err) {
                return reject(err);  // Gestione dell'errore di lettura
            }

            if (!existingFilm) {
                return reject(new Error("Film not found"));  // Film non trovato
            }

            title = title || existingFilm.title;
            favorite = favorite === undefined ? existingFilm.favorite : favorite;
            watchdate = watchdate || existingFilm.watchdate;
            rating = rating === undefined ? existingFilm.rating : rating;

            // Costruisci la query SQL per aggiornare il film
            const sql = "UPDATE films SET title = ?, favorite = ?, watchdate = ?, rating = ? WHERE id = ?";

            // Esegui l'update con i valori forniti o quelli esistenti
            db.run(sql, [title, favorite, watchdate, rating, id], function (err) {
                if (err) {
                    return reject(err);  // Se si verifica un errore, rifiuta la promise
                }

                // Se la query non ha modificato righe, significa che il film non è stato trovato
                if (this.changes === 0) {
                    return reject(new Error("Film not found"));
                }

                // Restituisci una risposta positiva
                resolve({ message: "Film updated successfully", changes: this.changes });
            });
        });
    });
};
