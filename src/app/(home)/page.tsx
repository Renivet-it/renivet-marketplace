import { IntroModal } from "@/components/globals/modals";
import {
    Arrivals,
    Blogs,
    Collection,
    Landing,
    Offer,
    Popular,
    Theme,
} from "@/components/home";

export default function Page() {
    return (
        <>
            <Landing />
            <Collection />
            <Offer />
            <Popular title="Best Sellers" />
            <Theme />
            <Arrivals title="New Arrivals" />
            <Blogs />
            <IntroModal />
        </>
    );
}
