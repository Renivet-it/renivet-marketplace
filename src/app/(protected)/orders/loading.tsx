export default function Loading() {
    return (
        <div aria-busy="true" className="space-y-4 p-6">
            <div className="h-10 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-32 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-24 animate-pulse rounded-xl bg-gray-200" />
        </div>
    );
}
