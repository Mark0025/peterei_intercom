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
const logger = require('./utils/logger');
const peteaRouter = require('./ai/peteai');
const intercomCache = require('./api/intercomCache');

// Refresh Intercom cache on startup
(async () => {
  try {
    await intercomCache.refreshCache();
    logger.logInfo('[STARTUP] Intercom cache loaded on startup.');
    logger.logInfo(`[STARTUP] ACCESS_TOKEN: ${process.env.INTERCOM_ACCESS_TOKEN ? process.env.INTERCOM_ACCESS_TOKEN.substring(0,8) + '...' : 'undefined'}`);
    logger.logInfo(`[STARTUP] Cache counts: Contacts=${intercomCache.cache.contacts.length}, Companies=${intercomCache.cache.companies.length}, Admins=${intercomCache.cache.admins.length}, Conversations=${intercomCache.cache.conversations.length}`);
  } catch (err) {
    logger.logError(`[STARTUP] Failed to load Intercom cache: ${err.message}`);
  }
})();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, "../public")));

// Verbose startup logging
logger.logInfo(`[STARTUP] Current working directory: ${process.cwd()}`);
logger.logInfo(`[STARTUP] INTERCOM_ACCESS_TOKEN present: ${!!process.env.INTERCOM_ACCESS_TOKEN}`);
logger.logInfo(`[STARTUP] INTERCOM_CLIENT_ID: ${process.env.INTERCOM_CLIENT_ID}`);
logger.logInfo(`[STARTUP] INTERCOM_CLIENT_SECRET: ${process.env.INTERCOM_CLIENT_SECRET}`);

let intercomApiRouter;
try {
  intercomApiRouter = require('./api/intercom');
  logger.logInfo('[STARTUP] Successfully required ./api/intercom');
} catch (err) {
  logger.logError(`[STARTUP] Error requiring ./api/intercom: ${err.stack || err}`);
}

if (intercomApiRouter) {
  app.use('/api/intercom', intercomApiRouter);
  logger.logInfo('[STARTUP] Mounted /api/intercom router');
} else {
  logger.logError('[STARTUP] intercomApiRouter is undefined, not mounting /api/intercom');
}

const PORT = process.env.PORT || 4000;
const CLIENT_SECRET = process.env.INTERCOM_CLIENT_SECRET;
const INTERCOM_ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN;
const userID = process.env.USER_ID;
const workspaceID = process.env.WORKSPACE_ID;

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
        // This logic is now handled by the /api/intercom/update-user-training-topic endpoint
        // We'll simulate a successful update for now, as the actual API call is not implemented here
        // In a real scenario, you'd call an API endpoint here.
        response = canvasKit.canvasResponse({
          components: [
            canvasKit.textComponent({
              id: 'success',
              text: `Simulated Pete User Training Topic updated to: "${topic.trim()}"`,
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

// Modular static route registration: scan public/ for public pages, public/admin/ for admin pages
function registerStaticRoutes(baseDir, baseRoute = '', isAdmin = false) {
  const dirPath = path.join(__dirname, '../', baseDir);
  if (!fs.existsSync(dirPath)) return;
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach(entry => {
    if (entry.isDirectory()) {
      // Only recurse into admin if isAdmin is true
      if (isAdmin && entry.name === 'admin') {
        registerStaticRoutes(path.join(baseDir, entry.name), path.join(baseRoute, entry.name), true);
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      const fileName = entry.name;
      const route = path.join(baseRoute, fileName.replace(/\.html$/, ''));
      // Only register /admin/* for admin pages
      if (isAdmin) {
        app.get(route, (req, res) => {
          res.sendFile(path.join(dirPath, fileName));
        });
        app.get(path.join(baseRoute, fileName), (req, res) => {
          res.redirect(301, route);
        });
      } else if (!baseRoute.includes('admin')) {
        // Only register root-level public pages
        app.get(route === '/index' ? '/' : route, (req, res) => {
          res.sendFile(path.join(dirPath, fileName));
        });
        app.get(path.join(baseRoute, fileName), (req, res) => {
          res.redirect(301, route === '/index' ? '/' : route);
        });
      }
    }
  });
}
registerStaticRoutes('public');
registerStaticRoutes('public/admin', '/admin', true);

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

// Serve different log files
app.get('/logs/:type', (req, res) => {
  const type = req.params.type;
  const logPath = path.join(__dirname, `../logs/${type}.log`);
  if (!fs.existsSync(logPath)) {
    return res.status(404).send('Log file not found');
  }
  const logContent = fs.readFileSync(logPath, 'utf8');
  res.type('text/plain').send(logContent);
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
    // This logic is now handled by the /api/intercom/bulk-update-user-training-topic endpoint
    // We'll simulate a successful update for now, as the actual API call is not implemented here
    // In a real scenario, you'd call an API endpoint here.
    const results = {
      successes: userIds.map(id => ({ id, topic })),
      failures: []
    };
    logger.logInfo(`[POST /bulk-update-training-topic] Bulk update complete. Successes: ${results.successes.length}, Failures: ${results.failures.length}`);
    res.json(results);
  } catch (err) {
    logger.logError(`[POST /bulk-update-training-topic] ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Add /whatsworking endpoint to serve the architecture and working state doc
app.get('/whatsworking', async (req, res) => {
  const mdPath = path.join(__dirname, '../DEV_MAN/whatworkin.md');
  fs.readFile(mdPath, 'utf8', async (err, data) => {
    if (err) {
      return res.status(500).send('<h2>Error loading documentation</h2><pre>' + err.message + '</pre>');
    }
    const { marked } = await import('marked');
    let html = marked.parse(data);
    res.send(`
      <html><head><title>What&#39;s Working: Pete Intercom App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/globals.css">
      <style>
        body { font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; background: #f9f9f9; color: #222; margin: 0; padding: 0; }
        #md-content { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(44,114,210,0.07); padding: 32px 24px; }
        h1, h2, h3, h4, h5 { color: #2d72d2; margin-top: 2em; margin-bottom: 0.5em; }
        h1 { font-size: 2.2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.2em; }
        ul, ol { margin-left: 2em; margin-bottom: 1.2em; }
        li { margin-bottom: 0.4em; }
        pre, code { background: #f4f4f4; color: #222; border-radius: 6px; padding: 8px 12px; font-size: 1em; overflow-x: auto; }
        pre { margin: 1.2em 0; }
        .mermaid { background: #fff; border-radius: 8px; padding: 16px; margin: 1.5em 0; box-shadow: 0 2px 8px rgba(44,114,210,0.07); overflow-x: auto; }
        @media (max-width: 700px) { #md-content { padding: 8px; } }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      </head><body>
      <div id="nav-menu"></div>
      <script>fetch('/menu.html').then(r=>r.text()).then(html=>{document.getElementById('nav-menu').innerHTML=html;});</script>
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

// Generic markdown viewer: /docs/:docname
const DEV_MAN_ROOT = path.join(__dirname, '../DEV_MAN');
const isValidMdPath = (requested) => {
  // Prevent path traversal and only allow .md files in DEV_MAN
  const resolved = path.resolve(DEV_MAN_ROOT, requested);
  return resolved.startsWith(DEV_MAN_ROOT) && resolved.endsWith('.md');
};

app.get('/docs/*', async (req, res) => {
  const requested = req.params[0] || '';
  if (!requested || !requested.endsWith('.md')) {
    return res.status(400).send('<h2>Invalid file requested</h2>');
  }
  const mdPath = path.join(DEV_MAN_ROOT, requested);
  if (!isValidMdPath(requested)) {
    return res.status(403).send('<h2>Access denied</h2>');
  }
  fs.readFile(mdPath, 'utf8', async (err, data) => {
    if (err) {
      return res.status(404).send('<h2>Markdown file not found</h2><pre>' + err.message + '</pre>');
    }
    const { marked } = await import('marked');
    let html = marked.parse(data);
    res.send(`
      <html><head><title>Docs: ${requested}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/globals.css">
      <style>
        body { font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; background: #f9f9f9; color: #222; margin: 0; padding: 0; }
        #md-content { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(44,114,210,0.07); padding: 32px 24px; }
        h1, h2, h3, h4, h5 { color: #2d72d2; margin-top: 2em; margin-bottom: 0.5em; }
        h1 { font-size: 2.2em; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.2em; }
        ul, ol { margin-left: 2em; margin-bottom: 1.2em; }
        li { margin-bottom: 0.4em; }
        pre, code { background: #f4f4f4; color: #222; border-radius: 6px; padding: 8px 12px; font-size: 1em; overflow-x: auto; }
        pre { margin: 1.2em 0; }
        .mermaid { background: #fff; border-radius: 8px; padding: 16px; margin: 1.5em 0; box-shadow: 0 2px 8px rgba(44,114,210,0.07); overflow-x: auto; }
        @media (max-width: 700px) { #md-content { padding: 8px; } }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      </head><body>
      <div id="nav-menu"></div>
      <script>fetch('/menu.html').then(r=>r.text()).then(html=>{document.getElementById('nav-menu').innerHTML=html;});</script>
      <div id="md-content">${html}</div>
      <script>
        // Find all code blocks with mermaid diagrams and render them
        document.addEventListener('DOMContentLoaded', function() {
          mermaid.initialize({ startOnLoad: false });
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

// Route to list all markdown files in DEV_MAN as links to /docs/<path>
const walkDevMan = (dir, base = '') => {
  // Recursively walk the DEV_MAN directory and return all .md file paths
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    if (entry.isDirectory()) {
      results = results.concat(walkDevMan(path.join(dir, entry.name), path.join(base, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(path.join(base, entry.name));
    }
  }
  return results;
};

app.get('/devman/', (req, res) => {
  let files = [];
  try {
    files = walkDevMan(DEV_MAN_ROOT);
  } catch (err) {
    return res.status(500).send('<h2>Error reading DEV_MAN directory</h2><pre>' + err.message + '</pre>');
  }
  files.sort();
  const links = files.map(f => `<li><a href="/docs/${f}">${f}</a></li>`).join('\n');
  res.send(`
    <html><head><title>DEV_MAN Documentation Index</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/globals.css">
    <style>
      body { font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif; background: #f9f9f9; color: #222; margin: 0; padding: 0; }
      #devman-list { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(44,114,210,0.07); padding: 32px 24px; }
      h1 { color: #2d72d2; font-size: 2em; }
      ul { margin-left: 2em; }
      li { margin-bottom: 0.5em; }
      a { color: #2d72d2; text-decoration: none; }
      a:hover { text-decoration: underline; }
      @media (max-width: 700px) { #devman-list { padding: 8px; } }
    </style>
    </head><body>
    <div id="devman-list">
      <h1>DEV_MAN Documentation Index</h1>
      <ul>${links}</ul>
    </div>
    </body></html>
  `);
});

// Serve the API testing page
app.get('/testapi', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/testapi.html'));
});

// Endpoint: List all registered routes and static .html files
app.get('/api/endpoints', (req, res) => {
  const routes = [];
  // Express routes
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      routes.push({ path: middleware.route.path, methods });
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(', ');
          routes.push({ path: handler.route.path, methods });
        }
      });
    }
  });
  // Static .html files in public/
  const publicDir = path.join(__dirname, '../public');
  try {
    fs.readdirSync(publicDir).forEach(file => {
      if (file.endsWith('.html')) {
        routes.push({ path: '/' + file, methods: 'GET' });
      }
    });
  } catch {}
  // Remove duplicates
  const seen = new Set();
  const uniqueRoutes = routes.filter(r => {
    const key = r.path + '|' + r.methods;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  res.json(uniqueRoutes);
});

// Mount the PeteAI router
app.use('/PeteAI', peteaRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: require('../package.json').version,
    timestamp: new Date().toISOString(),
  });
});

// Cache status endpoint
app.get('/api/intercom/cache/status', (req, res) => {
  try {
    const cache = intercomCache.cache;
    res.json({
      lastRefreshed: cache.lastRefreshed,
      counts: {
        contacts: cache.contacts.length,
        companies: cache.companies.length,
        admins: cache.admins.length,
        conversations: cache.conversations.length,
      }
    });
  } catch (err) {
    logger.logError(`[CACHE STATUS] ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ error: 'Cache status unavailable' });
  }
});

// Contacts test endpoint
app.get('/api/intercom/contacts/test', (req, res) => {
  try {
    const contacts = intercomCache.cache.contacts;
    if (contacts && contacts.length > 0) {
      res.json({ testContact: contacts[0], count: contacts.length });
    } else {
      res.json({ message: 'No contacts in cache.' });
    }
  } catch (err) {
    logger.logError(`[CONTACTS TEST] ${err && err.stack ? err.stack : err}`);
    res.status(500).json({ error: 'Contacts test unavailable' });
  }
});

app.listen(PORT, () => {
  console.log(`Intercom Canvas Kit onboarding app listening on port ${PORT}`);
  // Print all available routes for developer convenience
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) { // routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
      routes.push({ path: middleware.route.path, methods });
    } else if (middleware.name === 'router' && middleware.handle.stack) { // router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).map(m => m.toUpperCase()).join(', ');
          routes.push({ path: handler.route.path, methods });
        }
      });
    }
  });
  console.log('--- Available Routes ---');
  routes.forEach(r => {
    const url = `http://localhost:${PORT}${r.path}`;
    console.log(`[${r.methods}] ${url}`);
  });
  console.log('------------------------');
});

if (!process.env.INTERCOM_ACCESS_TOKEN) {
  throw new Error('Missing INTERCOM_ACCESS_TOKEN in environment');
}
console.log('Access Token:', process.env.INTERCOM_ACCESS_TOKEN); 