"use strict"

const dayjs = require('dayjs');
const sqlite = require('sqlite3');

function Film(id, title, favorite = false, watchdate = null, rating = null) {
    this.id = id;
    this.title = title;
    this.favorite = favorite;
    this.watchdate = watchdate && dayjs(watchdate);;
    this.rating = rating;

    this.toString = () => { return `id: ${this.id},` + `Title: ${this.title},` + `favorite: ${this.favorite},` + `watchdate: ${this.formatWatchdate('MMMM D, YYYY')},` + `Score ${this.rating}` };

    this.formatWatchdate = (format) => {
        return this.watchdate ? this.watchdate.format(format) : '<not defined>';
    };
}

function FilmLibrary() {
    const db = new sqlite.Database('films.db', (err) => { if (err) throw err; });

    this.closeDB = () => {
        try {
            db.close();
        }
        catch (error) {
            console.log(`Impossible to close the database! ${error}`);
        }
    }
    this.films = [];

    this.addNewFilm = film => this.films.push(film);
    this.SortBydate = () => this.films.sort((a, b) => {
        if (!a.watchdate) return 1;
        if (!b.watchdate) return -1;
        return dayjs(a.watchdate).diff(dayjs(b.watchdate));
    });
    this.DeleteFilm = id => this.films = this.films.filter(film => film.id !== id);
    this.ResetWatchedFilms = () => this.films.forEach(film => film.watchdate = null);
    this.getRated = () => this.films = this.films.filter(film => film.rating !== null)
        .sort((a, b) => b.rating - a.rating);

    this.print = () => this.films.forEach(item => console.log(item.toString()));

    //ASYNC METHOD
    this.GetAllFilm = () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM films', [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const films = rows.map(record =>
                        new Film(
                            record.id,
                            record.title,
                            record.favorite,
                            record.watchdate,
                            record.rating
                        )
                    );
                    resolve(films);
                }
            });
        });
    }

    this.GetFavoriteFilm = () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM films WHERE favorite=True', [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const films = rows.map(record =>
                        new Film(record.id, record.title, record.favorite, record.watchdate, record.rating));
                    resolve(films);
                }
            });
        });
    }

    this.GetWatchedToday = (data) => {
        return new Promise((resolve, reject) => {
            const today = dayjs(data).format('YYYY-MM-DD'); // Ottieni la data odierna
            db.all('SELECT * FROM films WHERE watchdate=?', [today], (err, rows) => { // Usa la data odierna
                if (err) {
                    reject(err); // Gestione degli errori
                } else {
                    const films = rows.map(record => {
                        return new Film(
                            record.id,
                            record.title,
                            record.favorite,  // Conversione del valore favorite a booleano se è 1
                            record.watchdate,  // La data formattata
                            record.rating
                        );
                    });
                    resolve(films); // Risolvi la Promise con i risultati
                }
            });
        });
    };


    this.GetFilmBeforeData = (watchdate) => {
        return new Promise((resolve, reject) => {
            const formattedDate = dayjs(watchdate).format('YYYY-MM-DD');  // Converte la data al formato YYYY-MM-DD
            db.all('SELECT * FROM films WHERE watchdate < ?', [formattedDate], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const films = rows.map(record => new Film(record.id, record.title, record.favorite, record.watchdate, record.rating));
                    resolve(films);
                }
            });
        });
    };
    this.GetFilmBeforeData = (watchdate) => {
        return new Promise((resolve, reject) => {
            const formattedDate = dayjs(watchdate).format('YYYY-MM-DD');  // Converte la data al formato YYYY-MM-DD
            db.all('SELECT * FROM films WHERE watchdate < ?', [formattedDate], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const films = rows.map(record => new Film(record.id, record.title, record.favorite, record.watchdate, record.rating));
                    resolve(films);
                }
            });
        });
    };

    this.RatingGraterThan = (rating) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM films WHERE rating >= ?', [rating], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const films = rows.map(record => new Film(record.id, record.title, record.favorite, record.watchdate, record.rating));
                    resolve(films); // Aggiungi questa riga per risolvere la promise con i risultati
                }
            });
        });
    };

    this.TitleContains = (title) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM films WHERE title LIKE ?', ["%" + title + "%"], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const films = rows.map(record => new Film(record.id, record.title, record.favorite, record.watchdate, record.rating));
                    resolve(films);
                }
            });
        });
    };

    // MODIFY DATABASE

    this.addFilm = (film) => {
        return new Promise((resolve, reject) => {
            // film.id is ignored since the unique id can only come from the database
            const query = 'INSERT INTO films(title, favorite, watchdate, rating) VALUES(?, ?, ?, ?)';
            const parameters = [film.title, film.favorite, film.watchdate.format("YYYY-MM-DD"), film.rating];
            db.run(query, parameters, function (err) {  // use function; this.lastID would not be available with an arrow function here
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
    };

    this.deleteFilm = (id) => {
        return new Promise((resolve, reject) => {
            // film.id is ignored since the unique id can only come from the database
            const query = 'DELETE FROM films WHERE id=?';
            const parameters = [id];
            db.run(query, parameters, function (err) {  // use function; this.lastID would not be available with an arrow function here
                if (err)
                    reject(err);
                else
                    resolve(this.changes);
            });
        });
    };
    this.deletewatchdate = () => {
        return new Promise((resolve, reject) => {
            // film.id is ignored since the unique id can only come from the database
            const query = 'UPDATE films SET watchdate = NULL';
            db.run(query, [], function (err) {  // use function; this.lastID would not be available with an arrow function here
                if (err)
                    reject(err);
                else
                    resolve(this.changes);
            });
        });
    };
}


async function main() {
    const f1 = new Film(1, "Pulp Fiction", true, "2023-03-10", 5);
    const f2 = new Film(2, "21 Grams", true, "2023-03-17", 4);
    const f3 = new Film(3, "Star Wars", false);
    const f4 = new Film(4, "Matrix");
    const f5 = new Film(5, "Shrek", false, "2023-03-21", 3);

    const library = new FilmLibrary();
    library.addNewFilm(f1);
    library.addNewFilm(f2);
    library.addNewFilm(f3);
    library.addNewFilm(f4);
    library.addNewFilm(f5);
    //library.SortBydate();
    //library.ResetWatchedFilms();
    //library.getRated();

    library.print()

    try {
        console.log('\n****** All the movies in the database: ******');
        const films = await library.GetAllFilm();
        if (films.length === 0) {
            console.log('No movies yet, try later.');
        } else {
            films.forEach((film) => console.log(film.toString()));
        }

        console.log('\n****** Movie favorite: ******');
        const favoritefilms = await library.GetFavoriteFilm();
        if (favoritefilms.length === 0) {
            console.log('No movies yet, try later.');
        } else {
            favoritefilms.forEach((film) => console.log(`${film}`));
        }

        console.log('\n****** watched today: ******');
        const watchted_today = await library.GetWatchedToday("2023-03-10");
        if (watchted_today.length === 0) {
            console.log('No movies yet, try later.');
        }
        else {
            watchted_today.forEach((film) => console.log(film.toString()))
        }

        console.log('\n****** GetFilmBeforeData: ******');
        const GetFilmBeforeData = await library.GetFilmBeforeData('2023-03-21');
        if (GetFilmBeforeData.length === 0) {
            console.log('No movies yet, try later.');
        }
        else {
            GetFilmBeforeData.forEach((film) => console.log(film.toString()))
        }

        console.log('\n****** RatingGraterThan: ******');
        const RatingGrater = await library.RatingGraterThan(4);
        if (RatingGrater.length === 0) {
            console.log('No movies yet, try later.');
        }
        else {
            RatingGrater.forEach((film) => console.log(film.toString()))
        }

        console.log('\n****** TitleContains: ******');
        const TitleContains = await library.TitleContains("Star wars");
        if (TitleContains.length === 0) {
            console.log('No movies yet, try later.');
        }
        else {
            TitleContains.forEach((film) => console.log(film.toString()))
        }

        // let newFilmId = -4;
        // console.log(`\n****** Adding a new movie: ******`);
        // const newFilm = new Film(newFilmId, "Fast & Furious", true, '2025-10-02', 2);
        // try {
        //     newFilmId = await library.addFilm(newFilm);
        //     console.log(`New film inserted! ID: ${newFilmId}.`);
        // } catch (error) {
        //     console.error(`Impossible to insert a new movie! ${error}`);
        // }

        console.log(`\n****** Deleting the movie ID: ******`);
        try {
            const deleted = await library.deleteFilm(8); // ID del film da eliminare
            if (deleted > 0)  // Verifica che almeno una riga sia stata eliminata
                console.log('Movie successfully deleted!');
            else
                console.error(`There is no movie to delete with id: 10`); // ID non trovato
        } catch (error) {
            console.error(`Impossible to delete the movie: ${error}`);
        }

        console.log(`\n****** Delete watch date: ******`);
        try {
            const deleted = await library.deletewatchdate(); // ID del film da eliminare
            if (deleted > 0)  // Verifica che almeno una riga sia stata eliminata
                console.log('watchdate succesfully delete!');
            else
                console.error(`There is no movie to delete`); // ID non trovato
        } catch (error) {
            console.error(`Impossible to delete the movie: ${error}`);
        }





    } catch (error) {
        console.error(`Impossible to retrieve movies! ${error}`);
    } finally {
        library.closeDB();
    }
}
main();