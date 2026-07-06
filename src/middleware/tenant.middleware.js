module.exports = (req, res, next) => {
    const tenantId = req.headers["x-tenant-id"];
    const entityId = req.headers["x-entity-id"];
    const userId = req.headers["x-user-id"];

    // const {
    //     tenantId,
    //     entityId,
    //     userId
    // } = req.context;

    if (!tenantId) {
        return res.status(400).json({
            success: false,
            message: "x-tenant-id header missing"
        });
    }

    req.context = {
        tenantId,
        entityId,
        userId
    };

    next();
};
