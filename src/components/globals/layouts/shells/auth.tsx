export function AuthShell({ children }: LayoutProps) {
    return (
        <section className="flex h-full min-h-screen">
            <div className="flex flex-1 items-center justify-center p-5">
                {children}
            </div>
        </section>
    );
}
