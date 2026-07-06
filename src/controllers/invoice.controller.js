const { v4: uuidv4 } = require("uuid");

const {
    invoices,
    invoiceLineItems,
    payments,
    paymentAllocations,
    journalEntries,
    journalEntryLines,
    auditLogs
} = require("../data/mock-db");
const {
    canTransition
} = require("../utils/invoice-state-machine");

exports.createInvoice = async (req, res) => {
    try {

        // const tenantId = req.headers["x-tenant-id"];
        // const entityId = req.headers["x-entity-id"];
        // const userId = req.headers["x-user-id"];

        const {
            tenantId,
            entityId,
            userId
        } = req.context;

        if (!tenantId) {
            return res.status(400).json({
                message: "x-tenant-id header is required"
            });
        }

        const {
            customerId,
            invoiceDate,
            dueDate,
            currency,
            exchangeRate,
            lineItems
        } = req.body;

        if (!customerId) {
            return res.status(400).json({
                message: "customerId is required"
            });
        }

        if (!lineItems || lineItems.length === 0) {
            return res.status(400).json({
                message: "At least one line item is required"
            });
        }

        let subtotal = 0;

        const invoiceId = uuidv4();

        const processedLineItems = lineItems.map(item => {

            const amount = item.quantity * item.unitPrice;

            subtotal += amount;

            const line = {
                id: uuidv4(),
                invoiceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                glAccountId: item.glAccountId,
                amount
            };

            invoiceLineItems.push(line);

            return line;
        });

        const invoice = {
            id: invoiceId,
            invoiceNumber: `INV-${Date.now()}`,

            tenantId,
            entityId,

            customerId,

            invoiceDate,
            dueDate,

            currency,
            exchangeRate,

            status: "DRAFT",

            subtotal,
            taxAmount: 0,
            totalAmount: subtotal,
            balanceAmount: subtotal,

            createdBy: userId,
            createdAt: new Date(),
            updatedBy: userId,
            updatedAt: new Date()
        };

        invoices.push(invoice);

        return res.status(201).json({
            success: true,
            data: {
                ...invoice,
                lineItems: processedLineItems
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

exports.getInvoiceById = async (req, res) => {
    try {

        // const tenantId = req.headers["x-tenant-id"];
        const {
            tenantId
        } = req.context;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "x-tenant-id header is required"
            });
        }

        const invoiceId = req.params.id;

        const invoice = invoices.find(
            inv =>
                inv.id === invoiceId &&
                inv.tenantId === tenantId
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        const lineItems = invoiceLineItems.filter(
            item => item.invoiceId === invoiceId
        );

        const allocations = paymentAllocations.filter(
            allocation => allocation.invoiceId === invoiceId
        );

        const paymentHistory = allocations.map(allocation => {

            const payment = payments.find(
                p => p.id === allocation.paymentId
            );

            return {
                paymentId: payment?.id,
                paymentReference: payment?.referenceNumber,
                paymentDate: payment?.paymentDate,
                allocatedAmount: allocation.allocatedAmount,
                currency: payment?.currency
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                customerId: invoice.customerId,

                status: invoice.status,

                invoiceDate: invoice.invoiceDate,
                dueDate: invoice.dueDate,

                currency: invoice.currency,
                exchangeRate: invoice.exchangeRate,

                subtotal: invoice.subtotal,
                taxAmount: invoice.taxAmount,
                totalAmount: invoice.totalAmount,

                currentBalance: invoice.balanceAmount,

                lineItems,

                paymentHistory,

                createdBy: invoice.createdBy,
                createdAt: invoice.createdAt,
                updatedBy: invoice.updatedBy,
                updatedAt: invoice.updatedAt
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

exports.approveInvoice = async (req, res) => {
    try {

        // const tenantId = req.headers["x-tenant-id"];
        // const entityId = req.headers["x-entity-id"];
        // const userId = req.headers["x-user-id"];

        const {
            tenantId,
            entityId,
            userId
        } = req.context;

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "x-tenant-id header is required"
            });
        }

        const invoiceId = req.params.id;

        const invoice = invoices.find(
            inv =>
                inv.id === invoiceId &&
                inv.tenantId === tenantId
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }

        /*
         Only draft invoices can be approved
        */
        // if (invoice.status !== "DRAFT") {
        //     return res.status(400).json({
        //         success: false,
        //         message: `Invoice cannot be approved because current status is ${invoice.status}`
        //     });
        // }
        if (
            !canTransition(
                invoice.status,
                "APPROVED"
            )
        ) {
            return res.status(400).json({
                message:
                    `Invalid transition from ${invoice.status} to APPROVED`
            });
        }

        const lineItems = invoiceLineItems.filter(
            item => item.invoiceId === invoiceId
        );

        if (lineItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invoice must contain line items before approval"
            });
        }

        /*
         Update invoice status
        */
        invoice.status = "APPROVED";
        invoice.updatedBy = userId;
        invoice.updatedAt = new Date();

        /*
         Create Journal Entry Header
        */
        const journalEntry = {
            id: `JE-${Date.now()}`,
            tenantId,
            entityId,
            referenceType: "INVOICE",
            referenceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            postingDate: new Date(),
            description: `Invoice Approval ${invoice.invoiceNumber}`,
            createdBy: userId,
            createdAt: new Date()
        };

        journalEntries.push(journalEntry);

        /*
         Debit Accounts Receivable
        */
        journalEntryLines.push({
            id: `JEL-${Date.now()}-1`,
            journalEntryId: journalEntry.id,
            glAccountCode: "1100",
            glAccountName: "Accounts Receivable",
            debit: invoice.totalAmount,
            credit: 0,
            currency: invoice.currency
        });

        /*
         Credit Revenue
        */
        journalEntryLines.push({
            id: `JEL-${Date.now()}-2`,
            journalEntryId: journalEntry.id,
            glAccountCode: "4000",
            glAccountName: "Revenue",
            debit: 0,
            credit: invoice.totalAmount,
            currency: invoice.currency
        });

        /*
         Audit Log
        */
        auditLogs.push({
            id: `AUD-${Date.now()}`,
            tenantId,
            tableName: "invoice",
            recordId: invoice.id,
            action: "APPROVE",
            oldValue: "DRAFT",
            newValue: "APPROVED",
            performedBy: userId,
            performedAt: new Date()
        });

        return res.status(200).json({
            success: true,
            message: "Invoice approved successfully",
            data: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                previousStatus: "DRAFT",
                currentStatus: invoice.status,
                journalEntryId: journalEntry.id
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