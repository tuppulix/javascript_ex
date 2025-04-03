"use strict";

const express = require("express");
const app = express();
const lab3query = require("./dao");
const { body, validationResult, param } = require("express-validator");

app.use(express.json()); // Required to read the body of requests

const validateId = param("id").isInt({ min: 0 }).withMessage('ID must be a positive integer');

// Middleware per la gestione degli errori di validazione
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// 📌 Get all films
app.get("/api/films", async (req, res) => {
    try {
        const result = await lab3query.getAllFilm();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Get a film by ID
app.get("/api/films/:id", [
    validateId,
    handleValidationErrors
], async (req, res) => {
    try {
        const result = await lab3query.getFilmById(req.params.id);
        if (!result) return res.status(404).json({ error: "Film not found" });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Create a new film (POST)
app.post("/api/films", [
    body('title').notEmpty().withMessage("Title is required").isString().withMessage("Title must be a String"),
    body('favorite').isIn([0, 1]).withMessage("Favorite must be 0 or 1"),
    body('watchdate').isDate().withMessage('Watchdate must be a valid date'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    handleValidationErrors // Gestisce la validazione e gli errori
], async (req, res) => {
    try {
        const { title, favorite, watchdate, rating } = req.body;
        if (!title || favorite === undefined || !watchdate || rating === undefined) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const result = await lab3query.insertFilmInDb(title, favorite, watchdate, rating);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Update the "favorite" status (PUT)
app.put("/api/films/:id/favorite", [
    validateId,
    body('favorite').isInt({ min: 0, max: 1 }).withMessage("Favorite must be 0 or 1"),
    handleValidationErrors // Gestisce la validazione e gli errori
], async (req, res) => {
    try {
        const { favorite } = req.body;
        if (favorite === undefined) {
            return res.status(400).json({ error: "Favorite field is required" });
        }
        const result = await lab3query.markFilm(req.params.id, favorite);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Update the rating of a film (PUT)
app.put("/api/films/:id/rating", [
    validateId,
    body('rating').isInt({ min: -1, max: 1 }).withMessage('Rating must be an integer between -1 and 1'),
    handleValidationErrors // Gestisce la validazione e gli errori
], async (req, res) => {
    try {
        const { rating } = req.body;
        if (rating === undefined) {
            return res.status(400).json({ error: "Rating field is required" });
        }
        const result = await lab3query.filmrating(req.params.id, rating);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Delete a film (DELETE)
app.delete("/api/films_delete/:id", [
    validateId,
    handleValidationErrors // Gestisce la validazione e gli errori
], async (req, res) => {
    try {
        const result = await lab3query.deleteFilm(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Filter films by category
app.get("/api/films/filter/:filters", [
    param("filters")
        .isString()
        .withMessage("Filter must be a string")
        .isIn(["favorite", "best", "data", "unseen"]),
    handleValidationErrors // Gestisce la validazione e gli errori
], async (req, res) => {
    try {
        const result = await lab3query.filmFilter(req.params.filters);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📌 Update a film (POST)
app.post("/api/films/update/:id", [
    validateId,
    handleValidationErrors // Gestisce la validazione e gli errori
], async (req, res) => {
    try {
        const { title, favorite, watchdate, rating } = req.body;
        const id = req.params.id;
        const result = await lab3query.filmUpdate(id, { title, favorite, watchdate, rating });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log("Server ready"));
