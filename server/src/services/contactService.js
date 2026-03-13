/**
 * Contact Service
 *
 * Business logic for contact request submissions,
 * retrieval, and follow-up questions.
 */
import * as contactRepository from "../repositories/contactRepository.js";
import * as questionRepository from "../repositories/questionRepository.js";
import * as userRepository from "../repositories/userRepository.js";

const CONTACT_CONSENT_VERSION =
  process.env.CONTACT_CONSENT_VERSION || "v1";

function buildError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function submitContactRequest(userId, data) {
  const request = await contactRepository.createContactRequest(userId, {
    consentTimestamp: data.consentTimestamp,
    consentVersion: data.consentVersion || CONTACT_CONSENT_VERSION,
  });

  const questions = [];
  for (const q of data.questions) {
    const created = await questionRepository.createQuestion(userId, {
      question: q.text,
      answer: null,
      source: "form",
      contactRequestId: request.id,
    });
    questions.push(created);
  }

  await userRepository.updateUserActivity(userId);
  return { ...request, questions };
}

export async function getMyRequests(userId) {
  const requests = await contactRepository.getRequestsByUserId(userId);
  const allQuestions = await questionRepository.getQuestionsByUserId(userId);

  return requests.map((req) => ({
    ...req,
    questions: allQuestions.filter(
      (q) => q.contact_request_id === req.id,
    ),
  }));
}

export async function addQuestion(userId, requestId, questionText) {
  const request = await contactRepository.getRequestById(requestId);

  if (!request) {
    throw buildError("Contact request not found", 404);
  }
  if (request.user_id !== userId) {
    throw buildError("Not authorized to add to this request", 403);
  }

  const question = await questionRepository.createQuestion(userId, {
    question: questionText,
    answer: null,
    source: "form",
    contactRequestId: requestId,
  });

  await userRepository.updateUserActivity(userId);
  return question;
}
