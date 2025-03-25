"use strict"

const dayjs = require('dayjs');

function Film(id, title, favorites = false, date=null, rating=null) {
    this.id = id;
    this.title = title;
    this.favorites = favorites;
    this.date = date && dayjs(date);;
    this.rating = rating;

    this.toString = () => {return `id: ${this.id},` + `Title: ${this.title},`+ `favorite: ${this.favorites},` + `date: ${this.formatWatchdate('MMMM D, YYYY')},` + `Score ${this.rating}`};

    this.formatWatchdate = (format) => {
        return this.date ? this.date.format(format) : '<not defined>';
    };
}

function FilmLibrary() {
    this.films = [];

    this.addNewFilm = film => this.films.push(film);
    this.SortBydate = () => this.films.sort((a, b) => {
        if (!a.date) return 1;  // Se 'a' non ha data, metti 'a' dopo 'b'
        if (!b.date) return -1; // Se 'b' non ha data, metti 'b' dopo 'a'
        return dayjs(a.date).diff(dayjs(b.date)); // Altrimenti confronta le date
      });
    this.DeleteFilm = id => this.films = this.films.filter(film => film.id !== id);
    this.ResetWatchedFilms = () => this.films.forEach(film => film.date=null);
    this.getRated = () => this.films = this.films.filter(film => film.rating !== null)
                                    .sort((a,b) => b.rating - a.rating);

    this.print = () => this.films.forEach(item => console.log(item.toString()));

}
function main() {
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
    library.getRated();
    library.print()
}

main();