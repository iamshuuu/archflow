import { router } from "./trpc";
import { projectRouter } from "./routers/project";
import { invoiceRouter } from "./routers/invoice";
import { teamRouter } from "./routers/team";
import { timeRouter } from "./routers/time";
import { notificationRouter } from "./routers/notification";
import { expenseRouter } from "./routers/expense";
import { allocationRouter } from "./routers/allocation";

export const appRouter = router({
    project: projectRouter,
    invoice: invoiceRouter,
    team: teamRouter,
    time: timeRouter,
    notification: notificationRouter,
    expense: expenseRouter,
    allocation: allocationRouter,
});

export type AppRouter = typeof appRouter;
