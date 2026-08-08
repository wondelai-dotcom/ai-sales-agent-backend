import { Router } from "express";
import { requireAuth } from "../../../shared/middlewares/auth";
import { clientController } from "./client.controller";

export const clientRouter = Router();

clientRouter.use(requireAuth);
clientRouter.get("/", clientController.list);
clientRouter.get("/export", clientController.exportCsv);
clientRouter.get("/:id", clientController.getById);
clientRouter.post("/", clientController.create);
clientRouter.patch("/:id", clientController.update);
clientRouter.delete("/:id", clientController.remove);
