const express = require("express");
const router = express.Router();

const invoiceController = require("../controllers/invoice.controller");

router.post("/", invoiceController.createInvoice);

router.get("/:id", invoiceController.getInvoiceById);

router.post("/:id/approve", invoiceController.approveInvoice);

module.exports = router;