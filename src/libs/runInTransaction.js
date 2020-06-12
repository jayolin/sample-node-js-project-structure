import mongoose from "mongoose";

/**
 * Runs the provided `mutations` callback within a transaction and commits the changes to the DB
 * only when it has run successfully.
 *
 * @param mutations A callback which does DB writes and reads using the session.
 */
export const runInTransaction = async mutations => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const value = await mutations(session);

    // Since the mutations ran without an error, commit the transaction.
    await session.commitTransaction();

    // Return any value returned by `mutations` to make this function as transparent as possible.
    return value;
  } catch (error) {
    // Abort the transaction as an error has occurred in the mutations above.
    await session.abortTransaction();

    // Rethrow the error to be caught by the caller.
    throw error;
  } finally {
    // End the previous session.
    session.endSession();
  }
};
