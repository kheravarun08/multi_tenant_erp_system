const {
    journalEntries,
    journalEntryLines
} = require("../data/mock-db");

exports.createInvoiceJournal = (
    invoice,
    userId
) => {

    const journalEntry = {
        id: `JE-${Date.now()}`,
        tenantId: invoice.tenantId,
        entityId: invoice.entityId,
        referenceType: "INVOICE",
        referenceId: invoice.id,
        postingDate: new Date(),
        description: `Invoice Approval ${invoice.invoiceNumber}`,
        createdBy: userId,
        createdAt: new Date()
    };

    journalEntries.push(journalEntry);

    journalEntryLines.push({
        id: `${journalEntry.id}-1`,
        journalEntryId: journalEntry.id,
        glAccountCode: "1100",
        glAccountName: "Accounts Receivable",
        debit: invoice.totalAmount,
        credit: 0
    });

    journalEntryLines.push({
        id: `${journalEntry.id}-2`,
        journalEntryId: journalEntry.id,
        glAccountCode: "4000",
        glAccountName: "Revenue",
        debit: 0,
        credit: invoice.totalAmount
    });

    return journalEntry;
};