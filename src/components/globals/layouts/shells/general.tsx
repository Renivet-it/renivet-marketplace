export function GeneralShell({ children }: LayoutProps) {
    return (
        <section className="flex w-full justify-center p-5 py-10">
            <div className="w-full max-w-5xl space-y-4 xl:max-w-[100rem]">
                {children}
            </div>
        </section>
    );
}
