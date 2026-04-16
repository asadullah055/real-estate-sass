import type { Request, Response } from "express";
import { sendSuccess } from "../../common/utils/apiResponse.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { parsePagination } from "../../common/utils/pagination.js";
import { toUserProfileDto } from "./users.dto.js";
import { UserService } from "./users.service.js";

export const UsersController = {
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const search = req.query.search as string | undefined;
    const { users, meta } = await UserService.listUsers(
      req.user!,
      pagination,
      search,
    );
    sendSuccess({ res, data: users.map(toUserProfileDto), meta });
  }),

  listAdmins: asyncHandler(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query);
    const search = req.query.search as string | undefined;
    const { users, meta } = await UserService.listAdmins(pagination, search);
    sendSuccess({ res, data: users.map(toUserProfileDto), meta });
  }),

  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.getUserById(req.params.id);
    sendSuccess({ res, data: toUserProfileDto(user) });
  }),

  updateUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as {
      status: "active" | "suspended" | "pending";
    };
    const updated = await UserService.updateUserStatus(
      req.params.id,
      status,
      req.user!,
    );
    sendSuccess({
      res,
      data: toUserProfileDto(updated),
      message: "Status updated",
    });
  }),

  createAdmin: asyncHandler(async (req: Request, res: Response) => {
    const admin = await UserService.createAdmin(
      req.body as { email: string; name: string },
    );
    sendSuccess({
      res,
      data: toUserProfileDto(admin),
      message: "Admin created",
    });
  }),

  updateAdmin: asyncHandler(async (req: Request, res: Response) => {
    const updated = await UserService.updateAdmin(
      req.params.id,
      req.body as {
        name?: string;
        status?: "active" | "suspended" | "pending";
      },
      req.user!,
    );
    sendSuccess({
      res,
      data: toUserProfileDto(updated),
      message: "Admin updated",
    });
  }),

  deleteAdmin: asyncHandler(async (req: Request, res: Response) => {
    await UserService.deleteAdmin(req.params.id, req.user!);
    sendSuccess({ res, message: "Admin deleted" });
  }),

  getAnalytics: asyncHandler(async (_req: Request, res: Response) => {
    const data = await UserService.getAnalytics();
    sendSuccess({ res, data });
  }),

  getDashboardStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await UserService.getDashboardStats();
    sendSuccess({ res, data: stats });
  }),
};
