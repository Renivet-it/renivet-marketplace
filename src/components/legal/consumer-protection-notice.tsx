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
        <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-slate-700">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Consumer Protection
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
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
