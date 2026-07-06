const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Record customer payment and allocate invoices
 *     tags:
 *       - Payments
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
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               exchangeRate:
 *                 type: number
 *               paymentDate:
 *                 type: string
 *                 example: 2026-07-06
 *               allocations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     invoiceId:
 *                       type: string
 *                     amount:
 *                       type: number
 *               autoAllocate:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *       400:
 *         description: Invalid payment request
 */
router.post("/", paymentController.createPayment);

module.exports = router;