const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customer.controller");

/**
 * @swagger
 * /customers/{id}/aging:
 *   get:
 *     summary: Retrieve AR aging summary for customer
 *     tags:
 *       - Customers
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
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: AR aging summary returned successfully
 *       404:
 *         description: Customer not found
 */
router.get("/:id/aging", customerController.getCustomerAging);

module.exports = router;