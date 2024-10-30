import { Icons } from "@/components/icons";
import {
    Sidebar as ShadSidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

interface Sidebar {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
    teams: {
        name: string;
        logo: keyof typeof Icons;
        plan: string;
    }[];
    navMain: {
        title: string;
        url: string;
        icon: keyof typeof Icons;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
    projects: {
        name: string;
        url: string;
        icon: keyof typeof Icons;
    }[];
}

const data: Sidebar = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "Acme Inc",
            logo: "GalleryVerticalEnd",
            plan: "Enterprise",
        },
        {
            name: "Acme Corp.",
            logo: "AudioWaveform",
            plan: "Startup",
        },
        {
            name: "Evil Corp.",
            logo: "Command",
            plan: "Free",
        },
    ],
    navMain: [
        {
            title: "Playground",
            url: "#",
            icon: "SquareTerminal",
            isActive: true,
            items: [
                {
                    title: "History",
                    url: "#",
                },
                {
                    title: "Starred",
                    url: "#",
                },
                {
                    title: "Settings",
                    url: "#",
                },
            ],
        },
        {
            title: "Models",
            url: "#",
            icon: "Bot",
            items: [
                {
                    title: "Genesis",
                    url: "#",
                },
                {
                    title: "Explorer",
                    url: "#",
                },
                {
                    title: "Quantum",
                    url: "#",
                },
            ],
        },
        {
            title: "Documentation",
            url: "#",
            icon: "BookOpen",
            items: [
                {
                    title: "Introduction",
                    url: "#",
                },
                {
                    title: "Get Started",
                    url: "#",
                },
                {
                    title: "Tutorials",
                    url: "#",
                },
                {
                    title: "Changelog",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "#",
            icon: "Settings2",
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
                {
                    title: "Billing",
                    url: "#",
                },
                {
                    title: "Limits",
                    url: "#",
                },
            ],
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: "Frame",
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: "PieChart",
        },
        {
            name: "Travel",
            url: "#",
            icon: "Map",
        },
    ],
};

export function Sidebar() {
    return (
        <ShadSidebar collapsible="icon">
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </ShadSidebar>
    );
}
