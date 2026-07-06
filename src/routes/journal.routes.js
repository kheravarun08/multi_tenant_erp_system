const express = require("express");
const router = express.Router();

const journalController = require("../controllers/journal.controller");

router.get("/", journalController.getJournalEntries);

module.exports = router;