"use strict"

const dayjs = require('dayjs');
const sqlite = require('sqlite3');
const express = require('express');
const app = express();
const db = new sqlite.Database('films.db', (err) => { if (err) throw err; });

// Function to close the database connection
function closeDB() {
    try {
        db.close();
    }
    catch (error) {
        console.log(`Impossible to close the database! ${error}`);
    }
}

// Retrieve the list of all films
exports.getAllFilm = () => new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM films';
    db.get(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
});

// Retrieve a film by its "id"
exports.getFilmById = (id) => new Promise((resolve, reject) => {
    const sql = "SELECT * FROM films WHERE id=?"
    db.get(sql, [id], (err, rows) => err ? reject(err) : resolve(rows))
});

// Create a new film, providing all relevant information (except for the "id" which is automatically assigned)
exports.insertFilmInDb = (title, favorite, watchdate, rating) => {
    return new Promise((resolve, reject) => {
        const sql = "INSERT INTO films(title, favorite, watchdate, rating) VALUES(?, ?, ?, ?)";

        db.run(sql, [title, favorite, watchdate, rating], function (err) {
            if (err) {
                return reject(err);  // Reject the promise if an error occurs
            }
            resolve({ id: this.lastID, title, favorite, watchdate, rating });  // Resolve with the ID of the newly inserted film
        });
    });
};

// Mark an existing film as favorite/unfavorite
exports.markFilm = (id, favorite) => {
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

// Change the rating of a specific film by specifying a delta value (e.g., +1 or -1). Only ratings that are not null can be changed
exports.filmrating = (id, delta) => {
    return new Promise((resolve, reject) => {
        const deltaNum = parseInt(delta);

        // Validation: delta must be either -1 or 1
        if (isNaN(deltaNum) || (deltaNum !== -1 && deltaNum !== 1)) {
            return reject(new Error("Invalid rating value"));
        }

        const updateSql = "UPDATE films SET rating = rating + ? WHERE id = ? AND rating IS NOT NULL";

        // We use db.get() because RETURNING * returns only one row
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

// Delete a film by its "id"
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

// Filter films by a specified filter type (favorite, best, data, unseen)
exports.filmFilter = (filter) => new Promise((resolve, reject) => {
    let sql = '';  // Initialize the sql variable only once
    let params = [];  // Initialize the params array as empty

    // Check which filter was passed and build the SQL query accordingly
    if (filter === "favorite") {
        sql = "SELECT * FROM films WHERE favorite=1";  
    } else if (filter === "best") {
        sql = "SELECT * FROM films WHERE rating>=5";
    } else if (filter === "data") {
        const lastMonthDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        sql = "SELECT * FROM films WHERE watchdate >= ?";  
        params.push(lastMonthDate);  // Add the parameter for the query
    } else if (filter === "unseen") {
        sql = "SELECT * FROM films WHERE watchdate IS NULL";
    }

    if (!sql) {
        return reject(new Error("Invalid filter"));  // Reject the promise if no valid filter is provided
    }

    // Execute the SQL query passing the params
    db.all(sql, params, (err, rows) => {
        if (err) {
            return reject(err);  // Reject the promise if an error occurs
        }
        resolve(rows);  // Resolve with the query results
    });
});

// Update an existing film by its "id"
exports.filmUpdate = (id, { title, favorite, watchdate, rating }) => {
    return new Promise((resolve, reject) => {
        // Retrieve the existing film from the database to get the current values
        const getFilmSql = "SELECT * FROM films WHERE id = ?";
        
        db.all(getFilmSql, [id], (err, existingFilm) => {
            if (err) {
                return reject(err);  // Handle read error
            }

            if (!existingFilm) {
                return reject(new Error("Film not found"));  // Film not found
            }

            // Use the provided values, or fallback to existing ones if not provided
            title = title || existingFilm.title;
            favorite = favorite === undefined ? existingFilm.favorite : favorite;
            watchdate = watchdate || existingFilm.watchdate;
            rating = rating === undefined ? existingFilm.rating : rating;

            // Build the SQL query to update the film
            const sql = "UPDATE films SET title = ?, favorite = ?, watchdate = ?, rating = ? WHERE id = ?";

            // Execute the update with either the provided or existing values
            db.run(sql, [title, favorite, watchdate, rating, id], function (err) {
                if (err) {
                    return reject(err);  // If an error occurs, reject the promise
                }

                // If no rows were affected, it means the film was not found
                if (this.changes === 0) {
                    return reject(new Error("Film not found"));
                }

                // Return a positive response
                resolve({ message: "Film updated successfully", changes: this.changes });
            });
        });
    });
};
