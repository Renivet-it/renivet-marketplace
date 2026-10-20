type LegalNoticeProps = {
    supportEmail?: string | null;
    supportPhone?: string | null;
    grievanceOfficerName?: string | null;
    grievanceOfficerEmail?: string | null;
    grievanceOfficerPhone?: string | null;
    grievanceOfficerAddress?: string | null;
};

export function ConsumerProtectionNotice(props: LegalNoticeProps) {
    const hasAny =
        props.supportEmail ||
        props.supportPhone ||
        props.grievanceOfficerName ||
        props.grievanceOfficerEmail ||
        props.grievanceOfficerPhone ||
        props.grievanceOfficerAddress;

    if (!hasAny) return null;

    return (
        <section className="mt-8 rounded-xl border border-[#f2dfdc] bg-[#e9d7d3] p-5 text-sm text-[#61333d]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#61333d]/75">
                Consumer Protection
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#3e2127]">
                Support And Grievance Redressal
            </h2>
            {props.supportEmail || props.supportPhone ? (
                <p className="mt-3">
                    Support: {props.supportEmail ?? "-"}
                    {props.supportPhone ? ` | ${props.supportPhone}` : ""}
                </p>
            ) : null}
            {props.grievanceOfficerName || props.grievanceOfficerEmail ? (
                <p className="mt-2">
                    Grievance Redressal Officer: {props.grievanceOfficerName ?? "-"}
                    {props.grievanceOfficerEmail
                        ? ` | ${props.grievanceOfficerEmail}`
                        : ""}
                    {props.grievanceOfficerPhone
                        ? ` | ${props.grievanceOfficerPhone}`
                        : ""}
                </p>
            ) : null}
            {props.grievanceOfficerAddress ? (
                <p className="mt-2">Address: {props.grievanceOfficerAddress}</p>
            ) : null}
        </section>
    );
}
