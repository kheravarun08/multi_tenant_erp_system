const swaggerJsDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Multi Tenant ERP Invoicing API",
            version: "1.0.0",
            description: "ERP Invoicing and Accounts Receivable Prototype"
        },
        servers: [
            {
                url: "http://localhost:3000"
            }
        ],
        tags: [
            {
                name: "Invoices",
                description: "Invoice operations"
            },
            {
                name: "Payments",
                description: "Payment operations"
            },
            {
                name: "Customers",
                description: "Customer and AR aging operations"
            },
            {
                name: "Journal Entries",
                description: "General Ledger operations"
            }
        ]
    },
    apis: [
        "./src/routes/*.js"
    ]
};

module.exports = swaggerJsDoc(options);