const mongoose = require('mongoose');

let isReplicaSet = null;

const checkReplicaSet = async () => {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.command({ replSetGetStatus: 1 }).catch(() => null);
    isReplicaSet = Boolean(status && status.ok === 1);
  } catch (err) {
    isReplicaSet = false;
  }
  return isReplicaSet;
};

const runInTransaction = async (workFn) => {
  const hasReplica = await checkReplicaSet();
  if (hasReplica) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await workFn(session);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone MongoDB fallback
    return await workFn(null);
  }
};

module.exports = { runInTransaction, checkReplicaSet };
