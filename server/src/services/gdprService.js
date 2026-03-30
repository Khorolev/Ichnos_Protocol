/**
 * GDPR Service
 *
 * Business logic for data export and account deletion.
 */
import firebaseAdmin from "../config/firebase.js";
import * as userRepository from "../repositories/userRepository.js";
import * as questionRepository from "../repositories/questionRepository.js";
import * as contactRepository from "../repositories/contactRepository.js";

export function scrubPII(text) {
  if (!text) return text;
  return text
    .replace(/[\w.-]+@[\w.-]+\.\w{2,}/g, "[REDACTED]")
    .replace(/\+?(?:\d[\s\-().]*){7,}/g, "[REDACTED]")
    .replace(/https?:\/\/\S+/g, "[REDACTED]");
}

export async function exportUserData(userId) {
  const userData = await userRepository.getUserById(userId);
  const contactRequests =
    await contactRepository.getRequestsByUserId(userId);
  const questions =
    await questionRepository.getQuestionsByUserId(userId);

  const allTopics = [];
  for (const question of questions) {
    const topics = await questionRepository.getTopicsByQuestionId(
      question.id,
    );
    allTopics.push(...topics);
  }

  const payload = {
    user: {
      firebaseUid: userData?.firebase_uid,
      createdAt: userData?.created_at,
    },
    profile: {
      name: userData?.name,
      surname: userData?.surname,
      email: userData?.email,
      phone: userData?.phone,
      company: userData?.company,
      linkedin: userData?.linkedin,
    },
    contactRequests,
    questions,
    topics: allTopics,
  };

  return JSON.stringify(payload, null, 2);
}

export async function deleteUserAccount(userId) {
  const questions =
    await questionRepository.getQuestionsByUserId(userId);

  for (const question of questions) {
    const scrubbedQuestion = scrubPII(question.question);
    const scrubbedAnswer = scrubPII(question.answer);
    await questionRepository.scrubQuestionTexts(
      question.id,
      scrubbedQuestion,
      scrubbedAnswer,
    );
  }

  await userRepository.deleteUserData(userId);
  await firebaseAdmin.auth().deleteUser(userId);

  return { success: true };
}
