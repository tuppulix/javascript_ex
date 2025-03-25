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


exports.getAllFilm = () => new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM films';
    db.get(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
});

exports.getFilmById = (id) => new Promise((resolve, reject) => {
    const sql = "SELECT * FROM films WHERE id=?"
    db.get(sql, [id], (err, rows) => err ? reject(err) : resolve(rows))
});

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

exports.markFilm = (id, favorite) => {
    return new Promise((resolve, reject) => {
        const checkSql = "SELECT favorite FROM films WHERE id = ?";
        db.get(checkSql, [id], (err, row) => {
            if (err) {
                return reject(err);
            }
            if (!row) {
                return reject(new Error("Film not found"));
            }
            if (row.favorite === parseInt(favorite)) {
                return resolve({ message: "No update needed, favorite is already set to this value" });
            }

            // Se il valore è diverso, allora aggiorniamo
            const updateSql = "UPDATE films SET favorite = ? WHERE id = ?";
            db.run(updateSql, [favorite, id], function (err) {
                if (err) {
                    return reject(err);
                }
                resolve({ message: "Film updated successfully", changes: this.changes });
            });
        });
    });
};

exports.filmrating = (id, delta) => {
    return new Promise((resolve, reject) => {
        const checksql = "SELECT rating FROM films WHERE id=?";

        db.get(checksql, [id], (err, row) => {
            if (err) {
                return reject(err);  // In caso di errore, rifiuta la Promise
            }
            if (!row) {
                return reject(new Error("Film not found"));
            }
            if (row.rating === null) {
                return reject(new Error("Film rating is null and cannot be changed"));
            }
            
            const deltaNum = parseInt(delta);
            if (isNaN(deltaNum)) {
                return reject(new Error("Invalid rating value"));
            }
            const newRating = row.rating + parseInt(delta);

            const sql = "UPDATE films SET rating=? WHERE id=?";

            db.run(sql, [newRating, id], function (err) {
                if (err) {
                    reject(err);
                }

                const getUpdatedFilm = "SELECT * FROM films WHERE id=?";

                db.get(getUpdatedFilm, [id], (err, row) => {
                    if (err) {
                        reject(err)
                    }
                    else {
                        resolve(row)
                    }
                });
            });


        });
    });
}


exports.deleteFilm = (id) => new Promise((resolve, reject) => {
    const sql = 'DELETE FROM films WHERE id=?';

    db.run(sql, [id], function(err) {
        if (err) {
            return reject(err);  
        }
        if (this.changes === 0) {
            return reject(new Error("Film not found"));  
        }
        resolve({ message: "Film deleted successfully" });  
    });
});
