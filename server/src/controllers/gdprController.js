/**
 * GDPR Controller
 *
 * Thin HTTP handlers for GDPR endpoints.
 * Delegates all business logic to gdprService.
 */
import * as gdprService from "../services/gdprService.js";
import { formatResponse } from "../helpers/formatResponse.js";

export async function downloadData(req, res, next) {
  try {
    const { uid } = req.user;

    const jsonString = await gdprService.exportUserData(uid);

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=my-data.json",
    );
    res.status(200).send(jsonString);
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { uid } = req.user;

    await gdprService.deleteUserAccount(uid);

    res
      .status(200)
      .json(formatResponse({ deleted: true }, "Account deleted"));
  } catch (error) {
    next(error);
  }
}
