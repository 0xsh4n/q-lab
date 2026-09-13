import { Router, type IRouter } from "express";
import healthRouter from "./health";
import acmedeskRouter from "./acmedesk";

const router: IRouter = Router();

router.use(healthRouter);
router.use(acmedeskRouter);

export default router;
