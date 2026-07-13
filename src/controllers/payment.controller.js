const { v4: uuidv4 } = require("uuid");

/*
These arrays already exist in invoice.controller.js.

For a real application these would be DB tables.
*/
const {
    invoices,
    payments,
    paymentAllocations,
    journalEntries,
    journalEntryLines,
    auditLogs,
    idempotencyStore
} = require("../data/mock-db");

exports.createPayment = async (req, res) => {
    try {

        const {
            tenantId,
            entityId,
            userId
        } = req.context;

        const idempotencyKey =
            req.headers["idempotency-key"];

        if (!idempotencyKey) {

            return res.status(400).json({
                success: false,
                message: "Idempotency-Key header is required"
            });

        }

        const existingRequest =
            idempotencyStore.find(
                request =>
                    request.tenantId === tenantId &&
                    request.idempotencyKey === idempotencyKey
            );

        if (existingRequest) {
            return res.status(200).json(existingRequest.response);
        }
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "x-tenant-id header is required"
            });
        }

        const {
            customerId,
            amount,
            currency,
            exchangeRate,
            paymentDate,
            allocations
        } = req.body;

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: "customerId is required"
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Payment amount must be greater than zero"
            });
        }

        let finalAllocations = allocations;

        if (
            (!allocations || allocations.length === 0)
            && req.body.autoAllocate
        ) {

            let remainingAmount = amount;

            finalAllocations = [];

            const eligibleInvoices = invoices
                .filter(
                    invoice =>
                        invoice.customerId === customerId &&
                        invoice.tenantId === tenantId &&
                        invoice.entityId === entityId &&
                        invoice.balanceAmount > 0 &&
                        (
                            invoice.status === "APPROVED" ||
                            invoice.status === "PARTIALLY_PAID"
                        )
                )
                .sort(
                    (a, b) =>
                        new Date(a.dueDate) -
                        new Date(b.dueDate)
                );

            for (const invoice of eligibleInvoices) {

                if (remainingAmount <= 0) {
                    break;
                }

                const allocationAmount = Math.min(
                    invoice.balanceAmount,
                    remainingAmount
                );

                finalAllocations.push({
                    invoiceId: invoice.id,
                    amount: allocationAmount
                });

                remainingAmount -= allocationAmount;
            }

        }


        const paymentId = uuidv4();

        const payment = {
            id: paymentId,
            tenantId,
            entityId,
            customerId,
            amount,
            currency,
            exchangeRate,
            paymentDate,
            referenceNumber: `PAY-${Date.now()}`,
            createdBy: userId,
            createdAt: new Date()
        };

        payments.push(payment);

        let totalAllocated = 0;

        const allocationResults = [];

        /*
     Process payment allocations
 */
        if (finalAllocations && finalAllocations.length > 0) {
            for (const allocation of finalAllocations) {

                const invoice = invoices.find(
                    inv =>
                        inv.id === allocation.invoiceId &&
                        inv.tenantId === tenantId &&
                        inv.entityId === entityId
                );

                if (!invoice) {
                    return res.status(404).json({
                        success: false,
                        message: `Invoice ${allocation.invoiceId} not found`
                    });
                }

                if (
                    invoice.status !== "APPROVED" &&
                    invoice.status !== "PARTIALLY_PAID"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `Invoice ${invoice.invoiceNumber} cannot receive payment`
                    });
                }

                if (allocation.amount > invoice.balanceAmount) {
                    return res.status(400).json({
                        success: false,
                        message: `Allocation exceeds invoice balance`
                    });
                }

                paymentAllocations.push({
                    id: uuidv4(),
                    paymentId,
                    invoiceId: invoice.id,
                    allocatedAmount: allocation.amount,
                    allocatedAt: new Date()
                });

                invoice.balanceAmount -= allocation.amount;

                totalAllocated += allocation.amount;

                if (invoice.balanceAmount === 0) {
                    invoice.status = "PAID";
                } else {
                    invoice.status = "PARTIALLY_PAID";
                }

                allocationResults.push({
                    invoiceId: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    allocatedAmount: allocation.amount,
                    remainingBalance: invoice.balanceAmount
                });
            }
        }

        /*
     Validate payment amount
 */
        if (totalAllocated > amount) {
            return res.status(400).json({
                success: false,
                message: "Allocated amount exceeds payment amount"
            });
        }

        /*
            Generate GL Entry
        */

        const journalEntry = {
            id: `JE-${Date.now()}`,
            tenantId,
            entityId,
            referenceType: "PAYMENT",
            referenceId: paymentId,
            postingDate: new Date(),
            description: `Customer Payment ${payment.referenceNumber}`,
            createdBy: userId
        };

        journalEntries.push(journalEntry);

        /*
            Debit Cash / Bank
        */

        journalEntryLines.push({
            id: uuidv4(),
            journalEntryId: journalEntry.id,
            glAccountCode: "1000",
            glAccountName: "Bank Account",
            debit: amount,
            credit: 0
        });

        /*
            Credit Accounts Receivable
        */

        journalEntryLines.push({
            id: uuidv4(),
            journalEntryId: journalEntry.id,
            glAccountCode: "1100",
            glAccountName: "Accounts Receivable",
            debit: 0,
            credit: amount
        });

        auditLogs.push({
            tableName: "payment",
            action: "CREATE"
        });
        const response = {
            success: true,
            message: "Payment recorded successfully",
            data: {
                paymentId,
                paymentReference: payment.referenceNumber,
                amount,
                allocations: allocationResults,
                journalEntryId: journalEntry.id
            }
        };

        idempotencyStore.push({
            tenantId,
            idempotencyKey,
            response
        });

        return res.status(201).json(response);

    } catch (error) {

        console.error(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};