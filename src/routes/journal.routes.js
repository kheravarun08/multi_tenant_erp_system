const express = require("express");
const router = express.Router();

const journalController = require("../controllers/journal.controller");

/**
 * @swagger
 * /journal-entries:
 *   get:
 *     summary: Retrieve GL journal entries for an invoice
 *     tags:
 *       - Journal Entries
 *     parameters:
 *       - in: header
 *         name: x-tenant-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-entity-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: invoice
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Journal entries retrieved successfully
 *       404:
 *         description: No journal entries found
 */
router.get("/", journalController.getJournalEntries);

module.exports = router;