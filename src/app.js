const express = require("express");
const invoiceRoutes = require("./routes/invoice.routes");

const app = express();

app.use(express.json());

const tenantMiddleware = require("./middleware/tenant.middleware");

app.use(tenantMiddleware);

app.use("/invoices", invoiceRoutes);

const paymentRoutes = require("./routes/payment.routes");

app.use("/payments", paymentRoutes);

const customerRoutes = require("./routes/customer.routes");

app.use("/customers", customerRoutes);  

const journalRoutes = require("./routes/journal.routes");

app.use("/journal-entries", journalRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
