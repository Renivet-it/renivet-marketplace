export function canAccessCustomerGrievance(
    ticket: { userId: string; category: string },
    userId: string
) {
    return ticket.category === "GRIEVANCE" && ticket.userId === userId;
}
