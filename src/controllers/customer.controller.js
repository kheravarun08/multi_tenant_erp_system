const {
    invoices
} = require("../data/mock-db");

exports.getCustomerAging = async (req, res) => {
    try {

        // const tenantId = req.headers["x-tenant-id"];
        const {
            tenantId,
        } = req.context;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "x-tenant-id header is required"
            });
        }

        const customerId = req.params.id;

        const customerInvoices = invoices.filter(
            invoice =>
                invoice.customerId === customerId &&
                invoice.tenantId === tenantId &&
                invoice.balanceAmount > 0 &&
                (
                    invoice.status === "APPROVED" ||
                    invoice.status === "PARTIALLY_PAID"
                )
        );

        let current = 0;
        let days30 = 0;
        let days60 = 0;
        let days90Plus = 0;

        const today = new Date();

        customerInvoices.forEach(invoice => {

            const dueDate = new Date(invoice.dueDate);

            const ageInDays = Math.floor(
                (today - dueDate) / (1000 * 60 * 60 * 24)
            );

            if (ageInDays <= 0) {
                current += invoice.balanceAmount;
            }
            else if (ageInDays <= 30) {
                days30 += invoice.balanceAmount;
            }
            else if (ageInDays <= 60) {
                days60 += invoice.balanceAmount;
            }
            else {
                days90Plus += invoice.balanceAmount;
            }
        });

        return res.status(200).json({
            success: true,
            data: {
                customerId,
                agingSummary: {
                    current,
                    days30,
                    days60,
                    days90Plus
                },
                totalOutstanding:
                    current +
                    days30 +
                    days60 +
                    days90Plus,
                currency:
                    customerInvoices.length > 0
                        ? customerInvoices[0].currency
                        : "USD"
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};