require('dotenv').config({ path: '../../.env' });
const updateUserTrainingTopic = require('./updateUserTrainingTopic');

// Replace with your actual Intercom Contact ID
const userId = '682f3c773fe6c381658c6b64';
const topic = 'Dominate Automation (Test)';

(async () => {
  try {
    const result = await updateUserTrainingTopic(userId, topic);
    console.log('Update successful:', result);
  } catch (err) {
    console.error('Update failed:', err.message);
  }
})(); 