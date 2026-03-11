/**
 * Firestore Category Count Utility
 *
 * Prints the number of knowledge_base documents matching a category.
 *
 * Usage:
 *   node scripts/utils/countFirestoreCategory.js --category regulations
 */
import "dotenv/config";
import firebaseAdmin from "../../src/config/firebase.js";

const categoryIndex = process.argv.indexOf("--category");

if (categoryIndex === -1 || !process.argv[categoryIndex + 1]) {
  console.error("Usage: node scripts/utils/countFirestoreCategory.js --category <name>");
  process.exit(1);
}

const category = process.argv[categoryIndex + 1];

try {
  const snapshot = await firebaseAdmin
    .firestore()
    .collection("knowledge_base")
    .where("category", "==", category)
    .get();
  console.log(snapshot.size);
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
