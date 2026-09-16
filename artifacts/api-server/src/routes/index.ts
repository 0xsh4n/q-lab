import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import techdeskRouter from "./techdesk";
import aiRouter from "./ai";
import apisecRouter from "./apisec";
import labRouter from "./lab";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(techdeskRouter);
router.use(aiRouter);
router.use(apisecRouter);
router.use(labRouter);

export default router;
