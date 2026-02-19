import { router } from "./trpc";
import { projectRouter } from "./routers/project";
import { invoiceRouter } from "./routers/invoice";
import { teamRouter } from "./routers/team";
import { timeRouter } from "./routers/time";

export const appRouter = router({
    project: projectRouter,
    invoice: invoiceRouter,
    team: teamRouter,
    time: timeRouter,
});

export type AppRouter = typeof appRouter;
