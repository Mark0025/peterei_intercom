const axios = require('axios');
require('dotenv').config({ path: '../../.env' }); // Ensure env vars are loaded
const logger = require('./logger');

/**
 * Update the 'user_training_topic' attribute for a user in Intercom.
 * @param {string} userId - The Intercom Contact ID of the user to update.
 * @param {string} topic - The new value for the user_training_topic attribute.
 * @returns {Promise<object>} - The Intercom API response data.
 * @throws {Error} - If the API call fails.
 */
async function updateUserTrainingTopic(userId, topic) {
  if (!userId || !topic) {
    throw new Error('Both userId and topic are required');
  }
  const url = `https://api.intercom.io/contacts/${userId}`;
  const payload = {
    custom_attributes: {
      user_training_topic: topic
    }
  };
  try {
    const response = await axios.put(url, payload, {
      headers: {
        'Intercom-Version': '2.13',
        'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    logger.logInfo(`Update successful: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (err) {
    // Log error details for debugging
    if (err.response) {
      logger.logError(`[updateUserTrainingTopic] API error: ${err.response.status} ${JSON.stringify(err.response.data)}`);
      throw new Error(`Intercom API error: ${err.response.status} ${JSON.stringify(err.response.data)}`);
    } else {
      logger.logError(`[updateUserTrainingTopic] Error: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Bulk update the 'user_training_topic' attribute for multiple users in Intercom.
 * @param {string[]} userIds - Array of Intercom Contact IDs to update.
 * @param {string} topic - The new value for the user_training_topic attribute.
 * @returns {Promise<{successes: object[], failures: object[]}>} - Summary of results.
 */
async function bulkUpdateUserTrainingTopic(userIds, topic) {
  const results = { successes: [], failures: [] };
  for (const userId of userIds) {
    try {
      const data = await updateUserTrainingTopic(userId, topic);
      results.successes.push({ userId, data });
      logger.logInfo(`[bulkUpdateUserTrainingTopic] Success for userId=${userId}`);
    } catch (err) {
      let errorDetails = err && err.stack ? err.stack : err;
      if (err.response) {
        errorDetails += ` | API response: ${JSON.stringify(err.response.data)}`;
      }
      logger.logError(`[bulkUpdateUserTrainingTopic] Failure for userId=${userId}: ${errorDetails}`);
      results.failures.push({ userId, error: errorDetails });
    }
  }
  logger.logInfo(`[bulkUpdateUserTrainingTopic] Finished. Successes: ${results.successes.length}, Failures: ${results.failures.length}`);
  return results;
}

module.exports = { updateUserTrainingTopic, bulkUpdateUserTrainingTopic };

(async () => {
  try {
    const userId = '682f3c773fe6c381658c6b64'; // Replace with your actual user/contact ID
    const topic = 'Dominate Automation (Test)';
    const result = await updateUserTrainingTopic(userId, topic);
    logger.logInfo(`Update successful: ${JSON.stringify(result)}`);
  } catch (err) {
    logger.logError(`Update failed: ${err.message}`);
  }
})(); 