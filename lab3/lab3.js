"use strict"

const dayjs = require('dayjs');
const sqlite = require('sqlite3');
const express = require('express');
const app = express();
const lab3query = require("./dao");

app.get("/api/films", async (req, res) => {
    try {
        const result = await lab3query.getAllFilm();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/films/:id", async (req, res) => {
    try {
        const result = await lab3query.getFilmById(req.params.id);
        res.status(200).json(result);
    }
    catch {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/films_create/:title/:favorite/:watchdate/:rating", async (req, res) => {
    try {
        const result = await lab3query.insertFilmInDb(req.params.title, req.params.favorite, req.params.watchdate, req.params.rating);
        res.status(201).json(result);
    }
    catch {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/films_mark/:id/:favorite", async (req, res) => {
    try {
        const result = await lab3query.markFilm(req.params.id, req.params.favorite);
        res.status(200).json(result);
    }
    catch {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/films_rating/:id/:rating", async (req, res) => {
    try {
        const result = await lab3query.filmrating(req.params.id, req.params.rating);
        res.status(200).json(result);
    }
    catch {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/films_delete/:id", async (req, res) => {
    try {
        const result = await lab3query.deleteFilm(req.params.id);
        res.status(200).json(result);
    }
    catch {
        res.status(500).json({ error: error.message });
    }
});




app.listen(3000, () => console.log('Server ready'));

 