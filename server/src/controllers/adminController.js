/**
 * Admin Controller
 *
 * Thin HTTP handlers for admin endpoints.
 * Delegates all business logic to adminService.
 */
import * as adminService from "../services/adminService.js";
import { formatResponse } from "../helpers/formatResponse.js";

function parseIntId(id) {
  const parsed = parseInt(id, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function validateUserId(userId) {
  return typeof userId === "string" && userId.trim().length > 0;
}

export async function getUsers(_req, res, next) {
  try {
    const users = await adminService.getUsers();
    res.status(200).json(formatResponse(users, "Users retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function getRequestsByUser(req, res, next) {
  try {
    const { userId } = req.params;

    if (!validateUserId(userId)) {
      return res
        .status(400)
        .json({ data: null, error: "Invalid userId", message: null });
    }

    const requests = await adminService.getRequestsByUserId(userId);
    res.status(200).json(formatResponse(requests, "Requests retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function getChatLeads(_req, res, next) {
  try {
    const leads = await adminService.getChatOnlyLeads();
    res.status(200).json(formatResponse(leads, "Chat leads retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function getChatLeadDetail(req, res, next) {
  try {
    const { userId } = req.params;

    if (!validateUserId(userId)) {
      return res
        .status(400)
        .json({ data: null, error: "Invalid userId", message: null });
    }

    const messages = await adminService.getChatLeadDetail(userId);
    res.status(200).json(formatResponse(messages, "Chat messages retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function updateRequest(req, res, next) {
  try {
    const requestId = parseIntId(req.params.id);

    if (!requestId) {
      return res
        .status(400)
        .json({ data: null, error: "Invalid request ID", message: null });
    }

    const updated = await adminService.updateRequest(requestId, req.body);
    res.status(200).json(formatResponse(updated, "Request updated"));
  } catch (error) {
    next(error);
  }
}

export async function deleteRequest(req, res, next) {
  try {
    const requestId = parseIntId(req.params.id);

    if (!requestId) {
      return res
        .status(400)
        .json({ data: null, error: "Invalid request ID", message: null });
    }

    const result = await adminService.deleteRequest(requestId);
    res.status(200).json(formatResponse(result, "Request deleted"));
  } catch (error) {
    next(error);
  }
}

export async function analyzeTopics(_req, res, next) {
  try {
    const result = await adminService.analyzeTopics();
    res.status(200).json(formatResponse(result, "Topics analyzed"));
  } catch (error) {
    next(error);
  }
}

export async function getTopics(_req, res, next) {
  try {
    const topics = await adminService.getTopics();
    res.status(200).json(formatResponse(topics, "Topics retrieved"));
  } catch (error) {
    next(error);
  }
}

export async function exportCSV(_req, res, next) {
  try {
    const csv = await adminService.exportToCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="contacts.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function manageAdmins(req, res, next) {
  try {
    const result = await adminService.manageAdmins(
      req.body.action,
      req.body.email,
    );
    res.status(200).json(formatResponse(result, "Admin updated"));
  } catch (error) {
    next(error);
  }
}

export async function runRetentionSweep(_req, res, next) {
  try {
    const result = await adminService.runRetentionSweep();
    res.status(200).json(formatResponse(result, "Retention sweep complete"));
  } catch (error) {
    next(error);
  }
}

export async function sendDailyDigest(_req, res, next) {
  try {
    const result = await adminService.sendDailyDigest();
    res.status(200).json(formatResponse(result, "Digest sent"));
  } catch (error) {
    next(error);
  }
}
