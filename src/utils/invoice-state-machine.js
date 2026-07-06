const transitions = {
    DRAFT: ["APPROVED"],
    APPROVED: ["PARTIALLY_PAID", "PAID"],
    PARTIALLY_PAID: ["PAID"],
    PAID: []
};

exports.canTransition = (
    current,
    next
) => {
    return (
        transitions[current] || []
    ).includes(next);
};