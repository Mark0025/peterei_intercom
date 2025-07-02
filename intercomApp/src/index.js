require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const canvasKit = require('./intercom/canvasKit');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const util = require('util');
const { updateUserTrainingTopic, bulkUpdateUserTrainingTopic } = require('./utils/updateUserTrainingTopic');
const logger = require('./utils/logger');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, "../public")));

const PORT = process.env.PORT || 4000;
const CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;

// Load and flatten onboarding questions
const questionsData = JSON.parse(fs.readFileSync(path.join(__dirname, "onboarding_questions.json"), 'utf8'));
const allQuestions = questionsData.sections.flatMap(section =>
  section.questions.map(q => ({
    section: section.title,
    ...q
  }))
);

// Middleware: Validate X-Body-Signature (Canvas Kit best practice)
// https://developers.intercom.com/docs/canvas-kit#signing-notifications
function validateSignature(req, res, next) {
  const signature = req.header('X-Body-Signature');
  const rawBody = JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', CLIENT_SECRET);
  hmac.update(rawBody, 'utf8');
  const digest = hmac.digest('hex');
  if (digest !== signature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
}

// Helper to log errors
function logError(context, err) {
  logger.logError(`[${context}] ${err && err.stack ? err.stack : err}`);
}

// Helper to build a Canvas Kit question component (step-by-step)
function buildQuestionCanvas(questionIdx, storedData = {}) {
  if (questionIdx >= allQuestions.length) {
    // All questions answered
    return {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'thanks',
              text: 'Thank you for completing onboarding!',
              align: 'center',
              style: 'header'
            },
            {
              type: 'button',
              label: 'Submit another',
              style: 'primary',
              id: 'refresh_button',
              action: { type: 'submit' }
            },
            {
              type: 'button',
              label: 'Show popout (all questions)',
              style: 'secondary',
              id: 'show_popout',
              action: { type: 'submit' }
            }
          ]
        },
        stored_data: { ...storedData, questionIdx }
      },
      event: { type: 'completed' }
    };
  }
  const question = allQuestions[questionIdx];
  return {
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            id: `section_${questionIdx}`,
            text: `Section: ${question.section}`,
            align: 'center',
            style: 'header'
          },
          {
            type: 'text',
            id: `qtext_${questionIdx}`,
            text: question.detailed
          },
          {
            type: 'input',
            id: `q_${questionIdx}`,
            label: question.shorthand,
            placeholder: question.detailed,
            input_type: 'text',
            required: true
          },
          {
            type: 'button',
            label: 'Next',
            style: 'primary',
            id: 'submit_button',
            action: { type: 'submit' }
          },
          {
            type: 'button',
            label: 'Show popout (all questions)',
            style: 'secondary',
            id: 'show_popout',
            action: { type: 'submit' }
          }
        ]
      },
      stored_data: { ...storedData, questionIdx }
    }
  };
}

// Helper to build the full form canvas (all questions at once)
function buildFullFormCanvas(storedData = {}) {
  return {
    canvas: {
      content: {
        components: [
          ...allQuestions.map((question, idx) => ([
            {
              type: 'text',
              id: `section_${idx}`,
              text: `Section: ${question.section}`,
              align: 'center',
              style: 'header'
            },
            {
              type: 'text',
              id: `qtext_${idx}`,
              text: question.detailed
            },
            {
              type: 'input',
              id: `q_${idx}`,
              label: question.shorthand,
              placeholder: question.detailed,
              input_type: 'text',
              required: true
            }
          ])).flat(),
          {
            type: 'button',
            label: 'Submit All',
            style: 'primary',
            id: 'submit_full_form',
            action: { type: 'submit' }
          },
          {
            type: 'button',
            label: 'Show popout (all questions)',
            style: 'secondary',
            id: 'show_popout',
            action: { type: 'submit' }
          }
        ]
      },
      stored_data: { ...storedData, fullForm: true }
    }
  };
}

// Add at the top:
const htmlEscape = str => str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));

// For browser testing
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Add /popout route to serve the standalone form
app.get('/popout', (req, res) => {
  try {
    // Build HTML form for all questions
    const formFields = allQuestions.map((q, idx) => `
      <div style='margin-bottom:16px;'>
        <label><b>${htmlEscape(q.shorthand)}</b><br><small>${htmlEscape(q.detailed)}</small></label><br>
        <input name="q_${idx}" type="text" style="width:100%;padding:8px;" required />
      </div>
    `).join('');
    res.send(`
      <html><head><title>Pete Onboarding Full Form</title></head>
      <body style="font-family:sans-serif;max-width:600px;margin:40px auto;">
        <h2>Pete Onboarding Full Form</h2>
        <form method="POST" action="/popout-submit">
          ${formFields}
          <button type="submit" style="padding:10px 20px;font-size:16px;">Submit</button>
        </form>
      </body></html>
    `);
  } catch (err) {
    console.error('[GET /popout]', err);
    res.status(500).send('<h2 style="color:red;">Something went wrong: ' + (err.message || err) + '</h2>');
  }
});

// Add /popout-submit route to process the form
app.post('/popout-submit', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const answers = {};
    allQuestions.forEach((q, idx) => {
      const key = `q_${idx}`;
      if (req.body[key] !== undefined) {
        answers[key] = req.body[key];
      }
    });
    // Send email with results
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'mark@peterei.com,jon@peterei.com',
      subject: 'New Onboarding Form Submission (Popout)',
      text: Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n')
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Failed to send email:', err);
    }
    res.send('<h2>Thank you for completing onboarding!</h2><p>Your responses have been submitted.</p>');
  } catch (err) {
    console.error('[POST /popout-submit]', err);
    res.status(500).send('<h2 style="color:red;">Something went wrong: ' + (err.message || err) + '</h2>');
  }
});

// Remove onboarding logic and only show a Canvas Kit card with two buttons
app.post('/initialize', (req, res) => {
  try {
    const response = canvasKit.canvasResponse({
      components: [
        canvasKit.textComponent({
          id: 'welcome',
          text: 'Welcome to Pete Intercom App! Choose an action below:',
          align: 'center',
          style: 'header'
        }),
        canvasKit.buttonComponent({
          id: 'open_popout',
          label: 'Open Full Onboarding Form',
          style: 'primary',
          actionType: 'url',
          url: 'https://peterei-intercom.onrender.com/popout',
          new_tab: true
        }),
        canvasKit.buttonComponent({
          id: 'pete_user_training',
          label: 'Pete User Training',
          style: 'secondary',
          actionType: 'submit'
        })
      ]
    });
    canvasKit.debugCanvasResponse(response, '/initialize');
    res.json(response);
  } catch (err) {
    console.error('[POST /initialize]', err);
    const errorResponse = canvasKit.errorCanvas({ message: 'Something went wrong: ' + (err.message || err) });
    canvasKit.debugCanvasResponse(errorResponse, '/initialize');
    res.json(errorResponse);
  }
});

// /submit can just return the same card for now (or handle future actions)
app.post('/submit', async (req, res) => {
  logger.logDebug(`[DEBUG] /submit endpoint hit ${JSON.stringify(req.body, null, 2)}`);
  try {
    const { component_id, input_values, context } = req.body;
    let response;
    if (component_id === 'pete_user_training') {
      response = canvasKit.canvasResponse({
        components: [
          canvasKit.textComponent({
            id: 'training_intro',
            text: 'Update Pete User Training Topic',
            align: 'center',
            style: 'header'
          }),
          canvasKit.inputComponent({ id: 'title', label: 'Title', required: true }),
          canvasKit.buttonComponent({ id: 'save_training_topic', label: 'Save Training Topic', style: 'primary', actionType: 'submit' })
        ]
      });
      canvasKit.debugCanvasResponse(response, '/submit (pete_user_training)');
      return res.json(response);
    }
    if (component_id === 'save_training_topic') {
      const topic = input_values?.title;
      let userId = req.body?.context?.user?.id;
      if (!userId) {
        userId = '682f3c773fe6c381658c6b64'; // Hardcoded fallback
        logger.logDebug(`[SUBMIT save_training_topic] No userId in context, using hardcoded fallback: ${userId}`);
      } else {
        logger.logDebug(`[SUBMIT save_training_topic] Using userId from context: ${userId}`);
      }
      if (!topic || typeof topic !== 'string' || !topic.trim()) {
        response = canvasKit.canvasResponse({
          components: [
            canvasKit.textComponent({
              id: 'error',
              text: 'Topic is required and must be a non-empty string.',
              align: 'center',
              style: 'error'
            })
          ]
        });
        canvasKit.debugCanvasResponse(response, '/submit (save_training_topic error)');
        return res.json(response);
      }
      try {
        await updateUserTrainingTopic(userId, topic.trim());
        response = canvasKit.canvasResponse({
          components: [
            canvasKit.textComponent({
              id: 'success',
              text: `Pete User Training Topic updated to: "${topic.trim()}"`,
              align: 'center',
              style: 'header'
            })
          ]
        });
        canvasKit.debugCanvasResponse(response, '/submit (save_training_topic success)');
        return res.json(response);
      } catch (err) {
        logger.logError(`[SUBMIT save_training_topic] Failed to update user_training_topic: ${err && err.stack ? err.stack : err}`);
        response = canvasKit.canvasResponse({
          components: [
            canvasKit.textComponent({
              id: 'error',
              text: 'Failed to update Pete User Training Topic. Please try again.',
              align: 'center',
              style: 'error'
            })
          ]
        });
        canvasKit.debugCanvasResponse(response, '/submit (save_training_topic error)');
        return res.json(response);
      }
    }
    // Default: show main card
    response = canvasKit.canvasResponse({
      components: [
        canvasKit.textComponent({
          id: 'welcome',
          text: 'Welcome to Pete Intercom App! Choose an action below:',
          align: 'center',
          style: 'header'
        }),
        canvasKit.buttonComponent({
          id: 'open_popout',
          label: 'Open Full Onboarding Form',
          style: 'primary',
          actionType: 'url',
          url: 'https://peterei-intercom.onrender.com/popout',
          new_tab: true
        }),
        canvasKit.buttonComponent({
          id: 'pete_user_training',
          label: 'Pete User Training',
          style: 'secondary',
          actionType: 'submit'
        })
      ]
    });
    canvasKit.debugCanvasResponse(response, '/submit (default)');
    res.json(response);
  } catch (err) {
    logger.logError(`[POST /submit] ${err && err.stack ? err.stack : err}`);
    const errorResponse = canvasKit.errorCanvas({ message: 'Something went wrong: ' + (err.message || err) });
    canvasKit.debugCanvasResponse(errorResponse, '/submit (error)');
    res.json(errorResponse);
  }
});

// New endpoint for Canvas Kit to open Pete User Training
app.post('/pete-user-training', (req, res) => {
  try {
    const response = {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'training_intro',
              text: 'Pete User Training: Access the latest training topics and resources.',
              align: 'center',
              style: 'header'
            },
            {
              type: 'button',
              label: 'Open Pete User Training',
              style: 'primary',
              id: 'open_training',
              action: {
                type: 'url',
                url: 'https://peterei-intercom.onrender.com/peteTraining.html',
                new_tab: true
              }
            }
          ]
        }
      }
    };
    canvasKit.debugCanvasResponse(response, '/pete-user-training');
    res.json(response);
  } catch (err) {
    logger.logError(`[POST /pete-user-training] ${err && err.stack ? err.stack : err}`);
    const errorResponse = canvasKit.errorCanvas({ message: 'Something went wrong: ' + (err.message || err) });
    canvasKit.debugCanvasResponse(errorResponse, '/pete-user-training (error)');
    res.json(errorResponse);
  }
});

// Add /hooks endpoint to display current webhook endpoints
app.get('/hooks', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const webhookFile = path.join(__dirname, '../webhook.txt');
  let content = '';
  try {
    content = fs.readFileSync(webhookFile, 'utf8');
    } catch (err) {
    content = 'webhook.txt not found or not yet generated.';
  }
  res.send(`
    <html><head><title>Current Webhook Endpoints</title></head>
    <body style="font-family:sans-serif;max-width:600px;margin:40px auto;">
      <h2>Current Intercom Webhook Endpoints</h2>
      <pre style="background:#f4f4f4;padding:16px;border-radius:8px;">${content}</pre>
      <p>Update these in your Intercom app settings as needed.</p>
    </body></html>
  `);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/webhooks', (req, res) => {
  // Your webhook handling logic here
  res.status(200).send('OK');
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/support.html'));
});

app.get('/logs', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logPath = path.join(__dirname, 'logs', 'app.log');
  fs.readFile(logPath, 'utf8', (err, data) => {
    if (err) {
      return res.type('text').send('(No logs yet or log file not found)');
    }
    res.type('text').send(data);
  });
});

app.get('/training', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/peteTraining.html'));
});

app.get('/get-user-training-topic', async (req, res) => {
  const userId = '682f3c773fe6c381658c6b64'; // fallback userId
  try {
    const url = `https://api.intercom.io/contacts/${userId}`;
    const resp = await axios.get(url, {
      headers: {
        'Intercom-Version': '2.13',
        'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`
      }
    });
    const data = resp.data;
    res.json({ user_training_topic: data.custom_attributes?.user_training_topic || null });
  } catch (err) {
    logger.logError(`[GET /get-user-training-topic] ${err && err.stack ? err.stack : err}`);
    res.json({ user_training_topic: null, error: err.message });
  }
});

/**
 * Helper to fetch user IDs by audience from Intercom.
 * @param {string} audience - 'admin', 'user', 'lead', 'everyone'
 * @returns {Promise<string[]>}
 */
async function getUserIdsByAudience(audience) {
  // Map audience to Intercom search filters
  let filter;
  switch ((audience || '').toLowerCase()) {
    case 'admin':
      filter = { role: 'admin' };
      break;
    case 'lead':
      filter = { role: 'lead' };
      break;
    case 'user':
      filter = { role: 'user' };
      break;
    case 'everyone':
    default:
      filter = {}; // No filter, get all
  }
  try {
    const url = 'https://api.intercom.io/contacts/search';
    const payload = filter && Object.keys(filter).length > 0 ? {
      query: {
        operator: 'AND',
        value: Object.entries(filter).map(([k, v]) => ({ field: k, operator: '=', value: v }))
      }
    } : { query: { operator: 'AND', value: [] } };
    const resp = await axios.post(url, payload, {
      headers: {
        'Intercom-Version': '2.13',
        'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const userIds = (resp.data.data || []).map(u => u.id).filter(Boolean);
    logger.logInfo(`[getUserIdsByAudience] Found ${userIds.length} users for audience=${audience}`);
    return userIds;
  } catch (err) {
    logger.logError(`[getUserIdsByAudience] Error for audience=${audience}: ${err && err.stack ? err.stack : err}`);
    throw err;
  }
}

app.post('/bulk-update-training-topic', async (req, res) => {
  const { audience, topic } = req.body;
  if (!audience || !topic) {
    logger.logError('[POST /bulk-update-training-topic] Missing audience or topic');
    return res.status(400).json({ error: 'audience and topic are required' });
  }
  try {
    const userIds = await getUserIdsByAudience(audience);
    if (!userIds.length) {
      logger.logError(`[POST /bulk-update-training-topic] No users found for audience=${audience}`);
      return res.status(404).json({ error: 'No users found for audience' });
    }
    const results = await bulkUpdateUserTrainingTopic(userIds, topic);
    logger.logInfo(`[POST /bulk-update-training-topic] Bulk update complete. Successes: ${results.successes.length}, Failures: ${results.failures.length}`);
    res.json(results);
  } catch (err) {
    logger.logError(`[POST /bulk-update-training-topic] ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Add /whatsworking endpoint to serve the architecture and working state doc
app.get('/whatsworking', (req, res) => {
  const mdPath = path.join(__dirname, '../../DEV_MAN/whatworkin.md');
  fs.readFile(mdPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('<h2>Error loading documentation</h2><pre>' + err.message + '</pre>');
    }
    // Try to use marked or markdown-it if available
    let html;
    try {
      const marked = require('marked');
      html = marked.parse(data);
    } catch (e) {
      html = '<pre style="white-space:pre-wrap;">' + data + '</pre>';
    }
    res.send(`
      <html><head><title>What&#39;s Working: Pete Intercom App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>body{font-family:sans-serif;max-width:900px;margin:40px auto;background:#f9f9f9;color:#222;} pre{background:#f4f4f4;padding:16px;border-radius:8px;} h1,h2,h3{color:#2d72d2;} code{background:#eee;padding:2px 4px;border-radius:4px;}</style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      </head><body>
      <div id="nav-menu"></div>
      <script>fetch('/menu.html').then(r=>r.text()).then(html=>{document.getElementById('nav-menu').innerHTML=html;});</script>
      <h1>What&#39;s Working: Pete Intercom App</h1>
      <div id="md-content">${html}</div>
      <script>
        // Find all code blocks with mermaid diagrams and render them
        document.addEventListener('DOMContentLoaded', function() {
          mermaid.initialize({ startOnLoad: false });
          // Find all <code class="language-mermaid"> or <pre><code class="language-mermaid">
          const mermaidBlocks = document.querySelectorAll('code.language-mermaid, pre > code.language-mermaid');
          let i = 0;
          mermaidBlocks.forEach(function(block) {
            const parent = block.parentElement.tagName === 'PRE' ? block.parentElement : block;
            const code = block.textContent;
            const id = 'mermaid-diagram-' + (i++);
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.id = id;
            div.textContent = code;
            parent.replaceWith(div);
            try { mermaid.init(undefined, '#' + id); } catch(e) { div.innerHTML = '<pre style="color:red">Mermaid error: ' + e.message + '</pre>'; }
          });
        });
      </script>
      </body></html>
    `);
  });
});

app.listen(PORT, () => {
  console.log(`Intercom Canvas Kit onboarding app listening on port ${PORT}`);
});

console.log('Access Token:', process.env.INTERCOM_ACCESS_TOKEN); 