const {
    journalEntries,
    journalEntryLines
} = require("../data/mock-db");

exports.getJournalEntries = async (req, res) => {
    try {

        const {
            tenantId
        } = req.context;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "x-tenant-id header is required"
            });
        }

        const invoiceId = req.query.invoice;

        if (!invoiceId) {
            return res.status(400).json({
                success: false,
                message: "invoice query parameter is required"
            });
        }

        /*
            Find journal entries for this invoice
        */

        const invoiceJournalEntries = journalEntries.filter(
            je =>
                je.referenceType === "INVOICE" &&
                je.referenceId === invoiceId &&
                je.tenantId === tenantId
        );

        const response = invoiceJournalEntries.map(entry => {

            const lines = journalEntryLines.filter(
                line => line.journalEntryId === entry.id
            );

            const totalDebit = lines.reduce(
                (sum, line) => sum + line.debit,
                0
            );

            const totalCredit = lines.reduce(
                (sum, line) => sum + line.credit,
                0
            );

            return {
                journalEntryId: entry.id,
                postingDate: entry.postingDate,
                description: entry.description,
                referenceType: entry.referenceType,
                referenceId: entry.referenceId,
                totalDebit,
                totalCredit,
                lines
            };
        });

        return res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};