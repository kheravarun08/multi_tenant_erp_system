const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customer.controller");

router.get("/:id/aging", customerController.getCustomerAging);

module.exports = router;