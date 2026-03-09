/**
 * Admin Service
 *
 * Business logic for admin dashboard operations.
 * Delegates data access to repositories.
 */
import * as adminRepository from "../repositories/adminRepository.js";
import * as contactRepository from "../repositories/contactRepository.js";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function getUsers() {
  return adminRepository.getUsersWithRequests();
}

export async function getRequestsByUserId(userId) {
  return adminRepository.getRequestsWithQuestionsByUserId(userId);
}

export async function getChatOnlyLeads() {
  return adminRepository.getChatOnlyUsers();
}

export async function getChatLeadDetail(userId) {
  return adminRepository.getChatMessagesByUserId(userId);
}

export async function updateRequest(requestId, updates) {
  const result = await contactRepository.updateRequest(requestId, updates);

  if (result === null) {
    throw buildError("Contact request not found", 404);
  }

  return result;
}

export async function deleteRequest(requestId) {
  const result = await contactRepository.deleteRequest(requestId);

  if (result === false) {
    throw buildError("Contact request not found", 404);
  }

  return { success: true };
}
