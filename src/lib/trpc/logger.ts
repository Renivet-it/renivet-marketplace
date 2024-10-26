import { AppRouter } from ".";

export function logRoutes(routerInstance: AppRouter, prefix = "") {
    const procedures = routerInstance._def.procedures;
    const routes: string[] = [];

    for (const [name, procedure] of Object.entries(procedures)) {
        if ("router" in procedure) {
            // @ts-expect-error
            routes.push(...logRoutes(procedure, `${prefix}${name}.`));
        } else {
            routes.push(`${prefix}${name}`);
        }
    }

    return routes;
}
