const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoice.controller");

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags:
 *       - Invoices
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               invoiceDate:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               currency:
 *                 type: string
 *               exchangeRate:
 *                 type: number
 *               lineItems:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
router.post("/", invoiceController.createInvoice);

router.post("/", invoiceController.createInvoice);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Retrieve invoice with current balance and payment history
 *     tags:
 *       - Invoices
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       404:
 *         description: Invoice not found
 */
router.get("/:id", invoiceController.getInvoiceById);

/**
 * @swagger
 * /invoices/{id}/approve:
 *   post:
 *     summary: Approve invoice and generate GL entries
 *     tags:
 *       - Invoices
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice approved successfully
 *       400:
 *         description: Invalid invoice state transition
 *       404:
 *         description: Invoice not found
 */

router.post("/:id/approve", invoiceController.approveInvoice);

module.exports = router;