export function DashShell({ children }: LayoutProps) {
    return (
        <>
            {/* <Sidebar /> */}

            <div className="flex flex-1 flex-col md:ml-72">
                {/* <NavbarDash /> */}

                {children}
            </div>
        </>
    );
}
