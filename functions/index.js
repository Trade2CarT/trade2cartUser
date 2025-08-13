const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// This function will run every day at 3:00 AM.
exports.deleteOldHistory = functions.pubsub.schedule("every day 03:00")
    .onRun(async (context) => {
        const db = admin.database();

        // Calculate the timestamp for 7 days ago.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffTimestamp = sevenDaysAgo.toISOString();

        // Get all completed assignments.
        const assignmentsRef = db.ref("assignments");
        const assignmentsQuery = assignmentsRef.orderByChild("status")
            .equalTo("completed");

        const snapshot = await assignmentsQuery.once("value");

        const updates = {};
        let deletedCount = 0;

        snapshot.forEach((child) => {
            const assignment = child.val();
            const assignmentId = child.key;

            // The timestamp could be in 'assignedAt' or 'timestamp'
            const assignmentTimestamp = assignment.assignedAt || assignment.timestamp;

            // If the assignment is older than 7 days, mark it for deletion.
            if (assignmentTimestamp && assignmentTimestamp < cutoffTimestamp) {
                updates[`/assignments/${assignmentId}`] = null;
                updates[`/bills/${assignmentId}`] = null; // Also delete the bill.
                deletedCount++;
            }
        });

        // Perform the deletion if there's anything to delete.
        if (Object.keys(updates).length > 0) {
            await db.ref().update(updates);
            console.log(`Successfully deleted ${deletedCount} old history records.`);
            return `Deleted ${deletedCount} records.`;
        } else {
            console.log("No old history records to delete.");
            return "No records to delete.";
        }
    });