/**
 * Admin Service
 *
 * Business logic for admin dashboard operations.
 * Delegates data access to repositories.
 */
import * as adminRepository from "../repositories/adminRepository.js";
import * as contactRepository from "../repositories/contactRepository.js";
import * as questionRepository from "../repositories/questionRepository.js";
import * as gdprService from "./gdprService.js";
import { callXaiApi } from "../services/chatService.js";
import {
  buildTopicMessages,
  parseTopicKeywords,
} from "../helpers/chatHelpers.js";
import { stringify } from "csv-stringify/sync";
import { Resend } from "resend";
import firebaseAdmin from "../config/firebase.js";

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

const TOPIC_BATCH_SIZE = 50;
const TOPIC_CONCURRENCY = 5;

async function processOneQuestion(q) {
  const raw = await callXaiApi(buildTopicMessages(q.question), 2000, {
    temperature: 0.3,
  });
  const topics = parseTopicKeywords(raw);

  for (const topic of topics) {
    await questionRepository.createTopic(q.id, {
      topic,
      confidence: null,
      model: "grok-3-mini",
    });
  }
}

export async function analyzeTopics() {
  const questions = await adminRepository.getUncategorizedQuestions();
  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < questions.length; i += TOPIC_BATCH_SIZE) {
    const batch = questions.slice(i, i + TOPIC_BATCH_SIZE);
    const results = [];

    for (let j = 0; j < batch.length; j += TOPIC_CONCURRENCY) {
      const chunk = batch.slice(j, j + TOPIC_CONCURRENCY);
      const settled = await Promise.allSettled(
        chunk.map((q) => processOneQuestion(q)),
      );
      results.push(...settled);
    }

    for (const r of results) {
      if (r.status === "fulfilled") {
        processed++;
      } else {
        skipped++;
      }
    }
  }

  return { processed, skipped };
}

export async function getTopics() {
  return adminRepository.getTopicAggregates();
}

export async function exportToCSV() {
  const rows = await adminRepository.getAllDataForExport();
  return stringify(rows, { header: true });
}

export async function manageAdmins(action, email) {
  try {
    const fbUser = await firebaseAdmin.auth().getUserByEmail(email);
    const existingClaims = fbUser.customClaims || {};
    const updatedClaims = { ...existingClaims, admin: action === "add" };

    await firebaseAdmin.auth().setCustomUserClaims(fbUser.uid, updatedClaims);

    return { success: true, email, action };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw buildError("User not found", 404);
    }
    throw error;
  }
}

export async function runRetentionSweep() {
  const users = await adminRepository.getInactiveUsers();
  const results = await Promise.allSettled(
    users.map((row) => gdprService.deleteUserAccount(row.firebase_uid)),
  );
  const anonymized = results.filter((r) => r.status === "fulfilled").length;

  return { processed: users.length, anonymized };
}

async function sendEmail(to, subject, html) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipients = String(to)
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const { error } = await resend.emails.send({
    from: "Ichnos Protocol <noreply@ichnos-protocol.com>",
    to: recipients,
    subject,
    html,
  });
  if (error) throw new Error(error.message);
}

function buildDigestHtml(inquiries, chatLeads) {
  const inquiryRows = inquiries
    .map((i) => {
      const preview = i.questionPreview ? `<br/><em>${i.questionPreview}</em>` : "";
      return `<li><b>${i.name}</b> (${i.email}, ${i.company || "N/A"}) — ${i.status}${preview}</li>`;
    })
    .join("");
  const leadRows = chatLeads
    .map((l) => `<li><b>${l.name}</b> (${l.email}) — ${l.totalMessages} messages</li>`)
    .join("");

  return `<h2>New Inquiries (${inquiries.length})</h2><ul>${inquiryRows || "<li>None</li>"}</ul>` +
    `<h2>Chat-Only Leads (${chatLeads.length})</h2><ul>${leadRows || "<li>None</li>"}</ul>`;
}

export async function sendDailyDigest() {
  const [inquiries, chatLeads] = await Promise.all([
    adminRepository.getRecentInquiries(),
    adminRepository.getRecentChatOnlyLeads(),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  const subject = `Daily Inquiry Digest – ${date}`;
  const html = buildDigestHtml(inquiries, chatLeads);

  await sendEmail(process.env.ADMIN_EMAILS, subject, html);

  return { sent: true, inquiries: inquiries.length, chatLeads: chatLeads.length };
}
