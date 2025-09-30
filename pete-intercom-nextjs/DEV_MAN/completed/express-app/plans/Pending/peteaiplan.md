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
const peteaRouter = require('./ai/peteai');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public/
app.use(express.static(path.join(\_\_dirname, "../public")));

// Verbose startup logging
logger.logInfo([STARTUP] Current working directory: ${process.cwd()});
logger.logInfo([STARTUP] INTERCOM_ACCESS_TOKEN present: ${!!process.env.INTERCOM_ACCESS_TOKEN});
logger.logInfo([STARTUP] INTERCOM_CLIENT_ID: ${process.env.INTERCOM_CLIENT_ID});
logger.logInfo([STARTUP] INTERCOM_CLIENT_SECRET: ${process.env.INTERCOM_CLIENT_SECRET});

let intercomApiRouter;
try {
intercomApiRouter = require('./api/intercom');
logger.logInfo('[STARTUP] Successfully required ./api/intercom');
} catch (err) {
logger.logError([STARTUP] Error requiring ./api/intercom: ${err.stack || err});
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
const questionsData = JSON.parse(fs.readFileSync(path.join(\_\_dirname, "onboarding_questions.json"), 'utf8'));
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
logger.logError([${context}] ${err && err.stack ? err.stack : err});
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
stored*data: { ...storedData, questionIdx }
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
id: section*${questionIdx},
            text: Section: ${question.section},
            align: 'center',
            style: 'header'
          },
          {
            type: 'text',
            id: qtext_${questionIdx},
text: question.detailed
},
{
type: 'input',
id: q\_${questionIdx},
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
id: section_${idx},
text: Section: ${question.section},
align: 'center',
style: 'header'
},
{
type: 'text',
id: qtext_${idx},
text: question.detailed
},
{
type: 'input',
id: q_${idx},
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
res.sendFile(path.join(\_\_dirname, "../public/index.html"));
});

// Add /popout route to serve the standalone form
app.get('/popout', (req, res) => {
try {
// Build HTML form for all questions
const formFields = allQuestions.map((q, idx) =>
<div style='margin-bottom:16px;'>
<label><b>${htmlEscape(q.shorthand)}</b><br><small>${htmlEscape(q.detailed)}</small></label><br>
<input name="q_${idx}" type="text" style="width:100%;padding:8px;" required />
</div>
).join('');
res.send(
<html><head><title>Pete Onboarding Full Form</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:40px auto;">
<h2>Pete Onboarding Full Form</h2>
<form method="POST" action="/popout-submit">
${formFields}
<button type="submit" style="padding:10px 20px;font-size:16px;">Submit</button>
</form>
</body></html>
);
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
const key = q\_${idx};
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
text: Object.entries(answers).map(([k, v]) => ${k}: ${v}).join('\n')
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
logger.logDebug([DEBUG] /submit endpoint hit ${JSON.stringify(req.body, null, 2)});
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
        logger.logDebug([SUBMIT save_training_topic] No userId in context, using hardcoded fallback: ${userId});
      } else {
        logger.logDebug([SUBMIT save_training_topic] Using userId from context: ${userId});
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
              text: Pete User Training Topic updated to: "${topic.trim()}",
align: 'center',
style: 'header'
})
]
});
canvasKit.debugCanvasResponse(response, '/submit (save_training_topic success)');
return res.json(response);
} catch (err) {
logger.logError([SUBMIT save_training_topic] Failed to update user_training_topic: ${err && err.stack ? err.stack : err});
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
logger.logError([POST /submit] ${err && err.stack ? err.stack : err});
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
logger.logError([POST /pete-user-training] ${err && err.stack ? err.stack : err});
const errorResponse = canvasKit.errorCanvas({ message: 'Something went wrong: ' + (err.message || err) });
canvasKit.debugCanvasResponse(errorResponse, '/pete-user-training (error)');
res.json(errorResponse);
}
});

// Add /hooks endpoint to display current webhook endpoints
app.get('/hooks', (req, res) => {
const fs = require('fs');
const path = require('path');
const webhookFile = path.join(\_\_dirname, '../webhook.txt');
let content = '';
try {
content = fs.readFileSync(webhookFile, 'utf8');
} catch (err) {
content = 'webhook.txt not found or not yet generated.';
}
res.send(
<html><head><title>Current Webhook Endpoints</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:40px auto;">
<h2>Current Intercom Webhook Endpoints</h2>
<pre style="background:#f4f4f4;padding:16px;border-radius:8px;">${content}</pre>
<p>Update these in your Intercom app settings as needed.</p>
</body></html>
);
});

app.get('/', (req, res) => {
res.sendFile(path.join(\_\_dirname, '../public/index.html'));
});

app.post('/webhooks', (req, res) => {
// Your webhook handling logic here
res.status(200).send('OK');
});

app.get('/support', (req, res) => {
res.sendFile(path.join(\_\_dirname, '../public/support.html'));
});

app.get('/logs', (req, res) => {
const fs = require('fs');
const path = require('path');
const logPath = path.join(\_\_dirname, 'logs', 'app.log');
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
const logPath = path.join(\_\_dirname, ../logs/${type}.log);
if (!fs.existsSync(logPath)) {
return res.status(404).send('Log file not found');
}
const logContent = fs.readFileSync(logPath, 'utf8');
res.type('text/plain').send(logContent);
});

app.get('/training', (req, res) => {
res.sendFile(path.join(\_\_dirname, '../public/peteTraining.html'));
});

app.get('/get-user-training-topic', async (req, res) => {
const userId = '682f3c773fe6c381658c6b64'; // fallback userId
try {
const url = https://api.intercom.io/contacts/${userId};
const resp = await axios.get(url, {
headers: {
'Intercom-Version': '2.13',
'Authorization': Bearer ${process.env.INTERCOM_ACCESS_TOKEN}
}
});
const data = resp.data;
res.json({ user_training_topic: data.custom_attributes?.user_training_topic || null });
} catch (err) {
logger.logError([GET /get-user-training-topic] ${err && err.stack ? err.stack : err});
res.json({ user_training_topic: null, error: err.message });
}
});

/\*\*

- Helper to fetch user IDs by audience from Intercom.
- @param {string} audience - 'admin', 'user', 'lead', 'everyone'
- @returns {Promise<string[]>}
  \*/
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
  'Authorization': Bearer ${process.env.INTERCOM_ACCESS_TOKEN},
        'Content-Type': 'application/json'
      }
    });
    const userIds = (resp.data.data || []).map(u => u.id).filter(Boolean);
    logger.logInfo([getUserIdsByAudience] Found ${userIds.length} users for audience=${audience});
  return userIds;
  } catch (err) {
  logger.logError([getUserIdsByAudience] Error for audience=${audience}: ${err && err.stack ? err.stack : err});
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
logger.logError([POST /bulk-update-training-topic] No users found for audience=${audience});
return res.status(404).json({ error: 'No users found for audience' });
}
const results = await bulkUpdateUserTrainingTopic(userIds, topic);
logger.logInfo([POST /bulk-update-training-topic] Bulk update complete. Successes: ${results.successes.length}, Failures: ${results.failures.length});
res.json(results);
} catch (err) {
logger.logError([POST /bulk-update-training-topic] ${err && err.stack ? err.stack : err});
res.status(500).json({ error: err.message || 'Internal server error' });
}
});

// Add /whatsworking endpoint to serve the architecture and working state doc
app.get('/whatsworking', async (req, res) => {
const mdPath = path.join(\_\_dirname, '../DEV_MAN/whatworkin.md');
fs.readFile(mdPath, 'utf8', async (err, data) => {
if (err) {
return res.status(500).send('<h2>Error loading documentation</h2><pre>' + err.message + '</pre>');
}
const { marked } = await import('marked');
let html = marked.parse(data);
res.send(
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
);
});
});

// Generic markdown viewer: /docs/:docname
const DEV_MAN_ROOT = path.join(\_\_dirname, '../DEV_MAN');
const isValidMdPath = (requested) => {
// Prevent path traversal and only allow .md files in DEV_MAN
const resolved = path.resolve(DEV_MAN_ROOT, requested);
return resolved.startsWith(DEV_MAN_ROOT) && resolved.endsWith('.md');
};

app.get('/docs/\*', async (req, res) => {
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
res.send(
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
);
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
const links = files.map(f => <li><a href="/docs/${f}">${f}</a></li>).join('\n');
  res.send(
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
);
});

// Serve the API testing page
app.get('/testapi', (req, res) => {
res.sendFile(path.join(\_\_dirname, '../public/testapi.html'));
});

// Mount the PeteAI router
app.use('/PeteAI', peteaRouter);

app.listen(PORT, () => {
console.log(Intercom Canvas Kit onboarding app listening on port ${PORT});
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
    const url = http://localhost:${PORT}${r.path};
    console.log([${r.methods}] ${url});
});
console.log('------------------------');
});

if (!process.env.INTERCOM_ACCESS_TOKEN) {
throw new Error('Missing INTERCOM_ACCESS_TOKEN in environment');
}
console.log('Access Token:', process.env.INTERCOM_ACCESS_TOKEN);

Teach me like i am brand new like we are building a lego house and learning javascript what is this doing be verbose comment out all code explain it to me like i am 5 years old expalin to me using emojis take me from a level 4 javascript developer to a level 10.

create interactive quizes asking me about my knowlege after you have taught me.

SUB_TOPICS

- [topic 1]
- [topic 2]
- [topic 3]

RULES

- Use concrete examples to explain every concept
- Use emojis to add expression
- Generate Generate one chapter at a time
- Ask for feedback at the end of each chapter
- Ask if I need clarification at the end of each chapter
- With each concept, explain real world use cases
- After we complete every sub topic, present a list of additional topics we can explore that align with my level, profession, topic and objective.

ChatGPT said:
Updated saved memory
Awesome! 🧱 Let's build your JavaScript brain like a LEGO house — block by block, with solid foundations and colorful pieces that make sense and stick! 🎨🧠

🧠 JavaScript Level-Up Journey: Chapter 1
🧱 What is this code doing? (Your Express.js Server)
We'll break this code down into small, understandable "bricks" 🧱. Imagine you're building a smart robot 🦾 who listens, talks, writes letters, fills out forms, and connects to the internet — that's basically what this JavaScript app is doing!

Let's walk through it with ✨BIG COMMENTS✨ and tons of visual help 👇

🔧 1. Setup Tools & Ingredients
js
Copy
Edit
require('dotenv').config();
🧂 This line loads secret ingredients (like API keys or passwords) from a hidden file called .env so we don't expose them in public code. Think of it like your robot loading a secret recipe! 🤫📄

js
Copy
Edit
const express = require('express');
🚗 This is your main vehicle (Express) — it helps us build a server that can drive through different roads (called routes), pick up requests, and drop off responses. 🛣️

js
Copy
Edit
const bodyParser = require('body-parser');
🍱 This helps the robot digest incoming messages (like form data) from humans, so it can understand them. It's like chewing your food before swallowing. 🧠➡️🍴

js
Copy
Edit
const crypto = require('crypto');
🔐 This helps you create secret codes (like signatures 🔏) so you know the messages came from a trusted source. It's your robot's lie detector!

js
Copy
Edit
const fs = require('fs');
📁 FS = File System. This lets your robot read/write files from your computer, like saving a journal or opening a to-do list.

js
Copy
Edit
const path = require('path');
🧭 path helps the robot find its way in folders and directories without getting lost. It's a map 🗺️ to help locate files.

js
Copy
Edit
const nodemailer = require('nodemailer');
📨 This gives your robot the power to send emails! Think of it as the robot picking up a letter and mailing it to your friends. 💌

js
Copy
Edit
const canvasKit = require('./intercom/canvasKit');
🖼️ This is a custom toolbox for drawing "cards" in Intercom — kinda like flashcards or popup forms. It's your robot's art kit. 🎨

js
Copy
Edit
const { v4: uuidv4 } = require('uuid');
🆔 This gives the robot the power to generate a unique ID (like a name tag) each time it does something. No two are the same! 🔢

js
Copy
Edit
const axios = require('axios');
🌐 This lets your robot make HTTP requests — basically, calling websites, APIs, or databases. Like asking a question on Google and waiting for an answer.

js
Copy
Edit
const util = require('util');
🛠️ A toolbox with useful utilities to help your robot with debugging, formatting, etc.

js
Copy
Edit
const { updateUserTrainingTopic, bulkUpdateUserTrainingTopic } = require('./utils/updateUserTrainingTopic');
👩‍🏫 These are custom-made tools your robot uses to update people's training topics in Intercom. Think of it as changing your school subject in a digital planner.

js
Copy
Edit
const logger = require('./utils/logger');
📓 The robot's diary — it writes down everything it does, especially if something goes wrong. Super useful when debugging.

js
Copy
Edit
const peteaRouter = require('./ai/peteai');
🤖 This plugs in your AI assistant! It gives your robot a brain that can learn and help users in smart ways.

🚀 Summary of Tools So Far
Tool What it Does Emoji
dotenv Loads secrets 🔐 🤫📄
express Web server 🚗 🛣️
body-parser Reads incoming data 🍱 🧠➡️🍴
crypto Validates messages 🕵️‍♂️ 🔏
fs, path Handles files & directories 📁🧭 📚
nodemailer Sends emails 💌 📨
canvasKit Builds visual cards 🖼️ 🎨
uuid Creates unique IDs 🆔 🔢
axios Talks to APIs 🌐 🤖📞
util Helper functions 🛠️ 🧰
logger Logs robot actions 📓 📋🪵
peteaRouter Connects to Pete AI 🧠 🤖🧩

🧠 Real World Analogy
Imagine you're building a smart assistant like Alexa or Siri:

It needs ears to hear your requests (🛣️ Express)

A mouth to reply (🔁 res.send())

A brain to process questions (🧠 PeteAI)

A notebook to remember things (📓 logger)

A pen to write emails (📨 nodemailer)

A map to find files (🧭 path)

And a badge to prove it's safe (🔐 crypto signature)

That's what all of this code is doing in the first few lines.

📝 MINI QUIZ: Chapter 1 (Setup & Imports)
What does express help us do?

A) Send emails

B) Build a website server

C) Generate random numbers

Which tool reads incoming request data like form submissions?

A) uuid

B) body-parser

C) fs

What does dotenv do?

A) Runs the robot

B) Stores environment variables securely

C) Sends emails

Which module lets us make HTTP requests to other websites or APIs?

A) nodemailer

B) axios

C) canvasKit

Why do we use uuid?

A) To send a message

B) To create a unique ID

C) To validate file paths

✅ Your Turn
Reply with your answers (just numbers and letters is fine, like 1-B, 2-B, 3-B...), and I'll grade you! 🧠✨
After that, I'll unlock Chapter 2: Express Routes & Middleware Magic 🔥

Let me know if you want clarification on anything in this chapter!

You said:

1. B , 2. B , 3. B , 4. B, 5. B.

ChatGPT said:
🎉 NAILED IT! 🎉
You got 5 out of 5 — 💯 Perfect score, JavaScript wizard-in-training! 🧙‍♂️🧱✨

🚪 Chapter 2: Express Routes & Middleware Magic
Now that your robot is loaded with tools, it's time to give it a voice and teach it how to talk to the world. Let's build its communication system — one route at a time!

🔄 What's a "Route"?
A route is like a door 🚪 to your robot. When someone knocks (visits a URL), the robot answers and does something.

🧠 Example:
js
Copy
Edit
app.get('/', (req, res) => {
res.send('👋 Hello World!');
});
This line says:

"Hey robot! If someone goes to your homepage (/), say 'Hello World!'" 🌍

app.get() – Listens for a GET request (like opening a page)

'/' – The route (URL path)

(req, res) => {} – The robot's response function

req = the incoming message/request

res = the outgoing reply

🎨 Let's visualize:
URL Path What Happens
/ Responds with 👋 Hello World!
/healthcheck Responds with ✅ All good!
/users Might return a list of users 🧑👩👨
/send-email Might trigger your robot to send an email 📨

🧙 Middleware: The Magic Filter
What is Middleware?
Middleware is like a security checkpoint or translator that sits between the visitor and your robot's brain.

It can log requests

Authenticate users

Parse data (e.g. convert raw text to JSON)

💡 Example:
js
Copy
Edit
app.use(bodyParser.json());
"Before ANYTHING else, make sure I can read JSON data in every request." ��

Another example:

js
Copy
Edit
app.use(express.static('public'));
"Let people access any images, scripts, or files inside the /public folder." 🖼️🗂️

🧰 Real Routes From Your Code
You had this:

js
Copy
Edit
app.use(express.static('public'));
app.use(bodyParser.json());
app.use('/peteai', peteaRouter);
Let's break it down:

📁 express.static('public')
→ Serve static files like images, CSS, HTML from /public folder.

🍱 bodyParser.json()
→ Automatically parse JSON data from incoming requests (e.g. { name: "Mark" })

🤖 /peteai
→ Connect the smart AI assistant's routes (like /peteai/ask, /peteai/learn, etc.)

🧠 Real World Analogy
Imagine your robot works in a hotel:

/ = Front door

/help = Concierge desk

/send-email = Mailroom

middleware = Front desk scanning ID badges, reading papers, checking for allergies 🧾👮‍♀️

🧪 MINI QUIZ: Chapter 2 (Routes & Middleware)
What does this line do?

js
Copy
Edit
app.get('/', (req, res) => {
res.send('Hi!');
});
A) It starts the server

B) It sets up a route that replies "Hi!" to homepage requests

C) It sends an email

What is middleware used for?

A) Changing your code

B) Handling HTML files

C) Processing requests before they hit routes

What does app.use(bodyParser.json()) do?

A) Makes the robot send JSON

B) Lets the robot read JSON

C) Ignores JSON

What does express.static('public') allow?

A) Public code editing

B) Serving static files like images or CSS

C) Automatically deploying apps

What does app.use('/peteai', peteaRouter) do?

A) Starts a new app

B) Loads environment variables

C) Mounts Pete AI's routes under /peteai

Reply with your answers like before (e.g. 1-B, 2-C...) and I'll grade you again!
When you're ready, we'll move into Chapter 3: Handling Form Submissions and POST Requests! 📝📬

You said:
this is what we have so far - /\*\*

- Intercom API Router (AI Content & Core GET Endpoints)
-
- Exposes GET endpoints for Intercom REST API resources:
- - Admins, Conversations, Contacts, Companies, Me
-
- See: https://developers.intercom.com/docs/references/rest-api/api.intercom.io/
-
- Usage:
- Mount this router at /api/intercom in your main app.
- Example: GET /api/intercom/admins
-
- Requires INTERCOM_ACCESS_TOKEN in environment.
  \*/

const express = require('express');
const axios = require('axios');
const router = express.Router();
const INTERCOM_API_BASE = 'https://api.intercom.io';
const AUTH_HEADER = token => ({
Authorization: Bearer ${token},
  'Intercom-Version': '2.13',
  'Accept': 'application/json',
});
const ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN?.replace(/^"|"$/g, '');
const logger = require('../utils/logger');

/\*\*

- Helper to fetch all paginated results from Intercom
- @param {string} path - API path (e.g., '/admins')
- @param {string} key - Key in response containing the array (e.g., 'admins')
- @returns {Promise<Array>} - All items
  \*/
  async function getAllFromIntercom(path, key) {
  let results = [];
  let nextUrl = ${INTERCOM_API_BASE}${path};
  while (nextUrl) {
  const resp = await axios.get(nextUrl, { headers: AUTH_HEADER(ACCESS_TOKEN) });
  const data = resp.data;
  if (Array.isArray(data[key])) results = results.concat(data[key]);
  nextUrl = data.pages && data.pages.next ? data.pages.next : null;
  }
  return results;
  }

/\*\*

- @route GET /admins
- @desc List all admins
  \*/
  router.get('/admins', (req, res) => proxyGet(req, res, '/admins'));

/\*\*

- @route GET /admins/:id
- @desc Retrieve an admin by ID
  \*/
  router.get('/admins/:id', (req, res) => proxyGet(req, res, /admins/${req.params.id}));

/\*\*

- @route GET /me
- @desc Get the currently authorized admin
  \*/
  router.get('/me', (req, res) => proxyGet(req, res, '/me'));

/\*\*

- @route GET /all/admins
- @desc Get all admins (paginated)
  \*/
  router.get('/all/admins', async (req, res) => {
  logger.logInfo('[GET /all/admins] Fetching all admins...', 'api.log');
  try {
  const admins = await getAllFromIntercom('/admins', 'admins');
  logger.logInfo([GET /all/admins] Success. Count: ${admins.length});
  res.json({ admins });
  } catch (err) {
  logger.logError([GET /all/admins] Error: ${err.message});
  res.status(500).json({ error: err.message });
  }
  });

/\*\*

- @route GET /conversations
- @desc List all conversations
  \*/
  router.get('/conversations', (req, res) => proxyGet(req, res, '/conversations'));

/\*\*

- @route GET /conversations/:id
- @desc Retrieve a conversation by ID
  \*/
  router.get('/conversations/:id', (req, res) => proxyGet(req, res, /conversations/${req.params.id}));

/\*\*

- @route GET /all/conversations
- @desc Get all conversations (paginated)
  \*/
  router.get('/all/conversations', async (req, res) => {
  logger.logInfo('[GET /all/conversations] Fetching all conversations...');
  try {
  const conversations = await getAllFromIntercom('/conversations', 'conversations');
  logger.logInfo([GET /all/conversations] Success. Count: ${conversations.length});
  res.json({ conversations });
  } catch (err) {
  logger.logError([GET /all/conversations] Error: ${err.message});
  res.status(500).json({ error: err.message });
  }
  });

/\*\*

- @route GET /contacts
- @desc List all contacts (users)
  \*/
  router.get('/contacts', (req, res) => proxyGet(req, res, '/contacts'));

/\*\*

- @route GET /contacts/:id
- @desc Retrieve a contact by ID
  \*/
  router.get('/contacts/:id', (req, res) => proxyGet(req, res, /contacts/${req.params.id}));

/\*\*

- @route GET /all/contacts
- @desc Get all contacts (paginated)
  \*/
  router.get('/all/contacts', async (req, res) => {
  logger.logInfo('[GET /all/contacts] Fetching all contacts...');
  try {
  const contacts = await getAllFromIntercom('/contacts', 'contacts');
  logger.logInfo([GET /all/contacts] Success. Count: ${contacts.length});
  res.json({ contacts });
  } catch (err) {
  logger.logError([GET /all/contacts] Error: ${err.message});
  res.status(500).json({ error: err.message });
  }
  });

/\*\*

- @route GET /search/contacts
- @desc Search contacts by email and/or name (live fetch, in-memory filter)
- @query email, name
  \*/
  router.get('/search/contacts', async (req, res) => {
  const { email, name } = req.query;
  logger.logInfo([SEARCH] /search/contacts?email=${email || ''}&name=${name || ''}, 'api.log');
  try {
  // Fetch all contacts (could be paginated for large datasets)
  const contacts = await getAllFromIntercom('/contacts', 'contacts');
  let results = contacts;
  if (email) {
  results = results.filter(c => c.email && c.email.toLowerCase().includes(email.toLowerCase()));
  }
  if (name) {
  results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
  }
  logger.logInfo([SEARCH] /search/contacts found ${results.length} results, 'api.log');
  res.json({ results });
  } catch (err) {
  logger.logError([SEARCH] /search/contacts error: ${err.message}, 'api.log');
  res.status(500).json({ error: err.message });
  }
  });

/\*\*

- @route GET /search/companies
- @desc Search companies by name (live fetch, in-memory filter)
- @query name
  \*/
  router.get('/search/companies', async (req, res) => {
  const { name } = req.query;
  logger.logInfo([SEARCH] /search/companies?name=${name || ''}, 'api.log');
  try {
  const companies = await getAllFromIntercom('/companies', 'companies');
  let results = companies;
  if (name) {
  results = results.filter(c => c.name && c.name.toLowerCase().includes(name.toLowerCase()));
  }
  logger.logInfo([SEARCH] /search/companies found ${results.length} results, 'api.log');
  res.json({ results });
  } catch (err) {
  logger.logError([SEARCH] /search/companies error: ${err.message}, 'api.log');
  res.status(500).json({ error: err.message });
  }
  });

/\*\*

- @route GET /companies
- @desc List all companies
  \*/
  router.get('/companies', (req, res) => proxyGet(req, res, '/companies'));

/\*\*

- @route GET /companies/:id
- @desc Retrieve a company by ID
  \*/
  router.get('/companies/:id', (req, res) => proxyGet(req, res, /companies/${req.params.id}));

/\*\*

- @route GET /all/companies
- @desc Get all companies (paginated)
  \*/
  router.get('/all/companies', async (req, res) => {
  logger.logInfo('[GET /all/companies] Fetching all companies...');
  try {
  const companies = await getAllFromIntercom('/companies', 'companies');
  logger.logInfo([GET /all/companies] Success. Count: ${companies.length});
  res.json({ companies });
  } catch (err) {
  logger.logError([GET /all/companies] Error: ${err.message});
  res.status(500).json({ error: err.message });
  }
  });

/\*\*

- Intercom API Router (AI Content Endpoints)
-
- Exposes GET endpoints for Intercom AI Content APIs:
- - Content Import Sources
- - External Pages
-
- See: https://developers.intercom.com/docs/references/rest-api/api.intercom.io/ai-content
-
- Usage:
- Mount this router at /api/intercom in your main app.
- Example: GET /api/intercom/ai/content_import_sources
-
- Requires INTERCOM_ACCESS_TOKEN in environment.
  \*/

function getAuthHeaders() {
return {
'Intercom-Version': '2.13',
'Authorization': Bearer ${process.env.INTERCOM_ACCESS_TOKEN},
'Content-Type': 'application/json',
};
}

/\*\*

- GET /api/intercom/ai/content_import_sources
- List all content import sources for the app.
- https://developers.intercom.com/docs/references/rest-api/api.intercom.io/ai-content#get-ai-content_import_sources
  \*/
  router.get('/ai/content_import_sources', async (req, res) => {
  try {
  const url = ${INTERCOM_API_BASE}/ai/content_import_sources;
  const resp = await axios.get(url, { headers: getAuthHeaders() });
  res.json(resp.data);
  } catch (err) {
  res.status(err.response?.status || 500).json({
  error: err.message,
  details: err.response?.data || null,
  });
  }
  });

/\*\*

- GET /api/intercom/ai/external_pages
- List all external pages in the Fin Content Library.
- https://developers.intercom.com/docs/references/rest-api/api.intercom.io/ai-content#get-ai-external_pages
  \*/
  router.get('/ai/external_pages', async (req, res) => {
  try {
  const url = ${INTERCOM_API_BASE}/ai/external_pages;
  const resp = await axios.get(url, { headers: getAuthHeaders() });
  res.json(resp.data);
  } catch (err) {
  res.status(err.response?.status || 500).json({
  error: err.message,
  details: err.response?.data || null,
  });
  }
  });

/\*\*

- Update the 'user_training_topic' attribute for a user in Intercom.
- @route PUT /contacts/:id/training-topic
- @body { topic: string }
  \*/
  router.put('/contacts/:id/training-topic', async (req, res) => {
  const userId = req.params.id;
  const topic = req.body.topic;
  if (!userId || !topic) {
  return res.status(400).json({ error: 'Both userId and topic are required' });
  }
  const url = ${INTERCOM_API_BASE}/contacts/${userId};
  const payload = { custom_attributes: { user_training_topic: topic } };
  try {
  const response = await axios.put(url, payload, {
  headers: {
  'Intercom-Version': '2.13',
  'Authorization': Bearer ${ACCESS_TOKEN},
        'Content-Type': 'application/json',
      },
    });
    logger.logInfo([PUT /contacts/${userId}/training-topic] Update successful: ${JSON.stringify(response.data)});
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      logger.logError([PUT /contacts/${userId}/training-topic] API error: ${err.response.status} ${JSON.stringify(err.response.data)});
      res.status(err.response.status).json({ error: err.response.data });
    } else {
      logger.logError([PUT /contacts/${userId}/training-topic] Error: ${err.message});
  res.status(500).json({ error: err.message });
  }
  }
  });

/\*\*

- Bulk update the 'user_training_topic' attribute for multiple users in Intercom.
- @route PUT /contacts/bulk-training-topic
- @body { userIds: string[], topic: string }
  \*/
  router.put('/contacts/bulk-training-topic', async (req, res) => {
  const userIds = req.body.userIds;
  const topic = req.body.topic;
  if (!Array.isArray(userIds) || !topic) {
  return res.status(400).json({ error: 'userIds (array) and topic are required' });
  }
  const results = { successes: [], failures: [] };
  for (const userId of userIds) {
  const url = ${INTERCOM_API_BASE}/contacts/${userId};
  const payload = { custom_attributes: { user_training_topic: topic } };
  try {
  const response = await axios.put(url, payload, {
  headers: {
  'Intercom-Version': '2.13',
  'Authorization': Bearer ${ACCESS_TOKEN},
          'Content-Type': 'application/json',
        },
      });
      results.successes.push({ userId, data: response.data });
      logger.logInfo([bulk-training-topic] Success for userId=${userId});
  } catch (err) {
  let errorDetails = err && err.stack ? err.stack : err;
  if (err.response) {
  errorDetails += | API response: ${JSON.stringify(err.response.data)};
      }
      logger.logError([bulk-training-topic] Failure for userId=${userId}: ${errorDetails});
  results.failures.push({ userId, error: errorDetails });
  }
  }
  logger.logInfo([bulk-training-topic] Finished. Successes: ${results.successes.length}, Failures: ${results.failures.length});
  res.json(results);
  });

/\*\*

- Unified GET proxy for Intercom endpoints
  \*/
  async function proxyGet(req, res, path) {
  const url = ${INTERCOM_API_BASE}${path};
  const tokenPresent = !!ACCESS_TOKEN && ACCESS_TOKEN.length > 10;
  logger.logInfo([proxyGet] Fetching from Intercom: ${url} | Token present: ${tokenPresent ? 'YES' : 'NO'},'api.log');
  if (!tokenPresent) {
  logger.logError('[proxyGet] ACCESS_TOKEN is missing or too short. Check your .env and dotenv loading.','api.log');
  return res.status(500).json({ error: 'Intercom access token missing. Check server logs and .env.' });
  }
  try {
  const response = await axios.get(url, {
  headers: AUTH_HEADER(ACCESS_TOKEN),
  params: req.query,
  });
  res.status(response.status).json(response.data);
  } catch (err) {
  logger.logError([proxyGet] Error for ${url}: ${err.message},'api.log');
  res.status(err.response?.status || 500).json({
  error: err.response?.data || err.message,
  });
  }
  }

module.exports = router;

--- peteai.js
const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

const openai = new OpenAI({
baseURL: 'https://openrouter.ai/api/v1',
apiKey: process.env.OPENROUTER_API_KEY,
defaultHeaders: {
'HTTP-Referer': process.env.SITE_URL || '',
'X-Title': process.env.SITE_NAME || '',
},
});

// POST /PeteAI/ - Basic chat agent
router.post('/', async (req, res) => {
try {
const userMessage = req.body.message;
if (!userMessage) {
return res.status(400).json({ error: 'Missing message in request body' });
}
const completion = await openai.chat.completions.create({
model: 'meta-llama/llama-3.2-3b-instruct:free',
messages: [{ role: 'user', content: userMessage }],
});
res.json({ reply: completion.choices[0].message });
} catch (err) {
res.status(500).json({ error: err.message || 'AI agent error' });
}
});

module.exports = router;

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PeteAI Chat Agent</title>
  <link rel="stylesheet" href="/globals.css">
  <style>
    #chat-container {
      max-width: 600px;
      margin: 40px auto;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 12px rgba(44,114,210,0.07);
      padding: 32px 24px;
    }
    #chat-log {
      min-height: 180px;
      background: #f4f4f4;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      font-size: 1.1em;
      color: #222;
      overflow-y: auto;
      max-height: 300px;
    }
    .user-msg { color: #2d72d2; font-weight: bold; }
    .ai-msg { color: #1a7f37; margin-bottom: 1em; }
    #ai-form input[type="text"] {
      width: 80%;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
      font-size: 1em;
      margin-right: 8px;
    }
    #ai-form button {
      background: #2d72d2;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 18px;
      font-size: 1em;
      cursor: pointer;
      transition: background 0.2s;
    }
    #ai-form button:hover {
      background: #1a5bb8;
    }
    @media (max-width: 700px) {
      #chat-container { padding: 8px; }
      #ai-form input[type="text"] { width: 60%; }
    }
  </style>
</head>
<body>
  <header style="display:flex;align-items:center;gap:18px;padding:18px 0 8px 0;">
    <a href="/index.html" style="display:inline-block;"><img src="/pete.png" alt="PETE Logo" style="height:48px;vertical-align:middle;"></a>
    <span style="font-size:2.1em;color:#2d72d2;font-weight:600;letter-spacing:0.1em;">PETE</span>
  </header>
  <div id="nav-menu"></div>
  <script>
    fetch('/menu.html').then(r => r.text()).then(html => {
      document.getElementById('nav-menu').innerHTML = html;
    });
  </script>
  <div id="chat-container">
    <h1 style="color:#2d72d2;">PeteAI Chat Agent 🤖</h1>
    <p>Ask anything! Powered by OpenRouter and GPT-4o.</p>
    <div id="chat-log"></div>
    <form id="ai-form" autocomplete="off">
      <input type="text" id="user-input" placeholder="Type your message..." required />
      <button type="submit">Send</button>
    </form>
  </div>
  <script>
    const form = document.getElementById('ai-form');
    const input = document.getElementById('user-input');
    const chatLog = document.getElementById('chat-log');

    function appendMessage(role, text) {
      const div = document.createElement('div');
      div.className = role === 'user' ? 'user-msg' : 'ai-msg';
      div.textContent = (role === 'user' ? 'You: ' : 'PeteAI: ') + text;
      chatLog.appendChild(div);
      chatLog.scrollTop = chatLog.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      appendMessage('user', message);
      input.value = '';
      appendMessage('ai', '...thinking...');
      try {
        const res = await fetch('/PeteAI/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        const data = await res.json();
        // Remove the '...thinking...' message
        const last = chatLog.querySelector('.ai-msg:last-child');
        if (last && last.textContent === 'PeteAI: ...thinking...') last.remove();
        if (data.reply && data.reply.content) {
          appendMessage('ai', data.reply.content);
        } else if (data.reply) {
          appendMessage('ai', data.reply);
        } else {
          appendMessage('ai', data.error || 'No reply from AI.');
        }
      } catch (err) {
        const last = chatLog.querySelector('.ai-msg:last-child');
        if (last && last.textContent === 'PeteAI: ...thinking...') last.remove();
        appendMessage('ai', 'Error: ' + (err.message || err));
      }
    });

  </script>
</body>
</html>

what i want is for my ai agent to be able to use these api endpoints seamleesley

we are caching the data so can we use the cache as what the llm could use.

Abiltiy to have the agent use our db as souce of knowlege or make genearal queries.

have option in the html for intercom >> connected to our api

i want to be able to turn on and off - https://openrouter.ai/docs/features/web-searchi want o be able to use
https://openrouter.ai/docs/features/prompt-caching

https://openrouter.ai/docs/features/presets for structuring responses

does this make sense teach me how we would do that fowwling open router best practices , also model changing from my avaliableModels.json that is in utils ?

ChatGPT said:
Updated saved memory
This absolutely makes sense — you're aiming to make PeteAI a fully integrated, smart agent that can:

Query your own APIs (Intercom, etc.).

Use your app's cache/database as its source of truth.

Toggle OpenRouter features like web search, prompt caching, and presets.

Support dynamic model selection via a config file.

Let's break down how to implement each of these cleanly, using OpenRouter best practices:

✅ 1. Let the AI Agent Use Your API (Intercom)
Goal:
Let PeteAI "think" using the data from your /api/intercom/\* endpoints.

🔧 Solution:
Use function calling (a.k.a. "tools" in OpenRouter). You'll define tools like:

js
Copy
Edit
{
name: "get_all_contacts",
description: "Fetches all Intercom contacts from our backend cache",
parameters: {
type: "object",
properties: {},
required: []
}
}
Then handle those calls in your backend — have a tools/handlers.js file that executes fetch('/api/intercom/all/contacts'), or pulls it from a Redis cache if available.

✅ 2. Use Your Cache/DB as AI Knowledge
You'll want to "ground" the AI in your known data. There are 2 good options:

Option A: Function Calling (Dynamic)
Let the AI decide when to call APIs to pull fresh or cached data.

This is great for real-time lookups (e.g., get_training_topic_for_user(userId)).

Option B: Vector DB or Manual Context Injection
Pull from cache or DB on every user message, and include it in the prompt:

js
Copy
Edit
const groundingData = await getCachedUserData(userId);
const messages = [
{ role: 'system', content: `Use this user context: ${JSON.stringify(groundingData)}` },
{ role: 'user', content: userMessage }
];
✅ 3. Enable Intercom View in HTML
Add a switch to your chat UI:

html
Copy
Edit
<label>
<input type="checkbox" id="enableIntercom" />
Use Intercom Knowledge
</label>
Send this flag in the POST /PeteAI/ request, then use it server-side to decide:

Whether to inject Intercom context into the prompt

Whether to enable tool usage to call /api/intercom routes

✅ 4. Toggle OpenRouter Features
OpenRouter lets you pass these per request via headers or query parameters:

🔄 a. Web Search
If user toggles this on:

js
Copy
Edit
headers['OpenRouter-Web-Search'] = 'true';
Or if not, omit that header.

💾 b. Prompt Caching
Enable by default, unless debugging:

js
Copy
Edit
headers['OpenRouter-Prompt-Caching'] = 'true';
You can make this user-toggleable via a checkbox like "Enable Fast Memory Mode".

🎛️ c. Presets
Presets control style, tone, format, etc.

Define one on OpenRouter (e.g. pete-default), then set:

js
Copy
Edit
headers['OpenRouter-Preset'] = 'pete-default';
You can let users choose their tone/persona in a dropdown and map to a preset.

✅ 5. Switching Models via availableModels.json
Store this in utils/availableModels.json:

json
Copy
Edit
[
{ "id": "meta-llama/llama-3.2-3b-instruct:free", "name": "LLaMA 3 Small" },
{ "id": "gpt-4o", "name": "GPT-4o (Pro)" },
{ "id": "mistral/mistral-7b-instruct", "name": "Mistral Fast" }
]
Then in your frontend:

js
Copy
Edit
fetch('/utils/availableModels.json')
.then(r => r.json())
.then(models => {
// Render dropdown menu
});
In the backend /PeteAI/ route:

js
Copy
Edit
const selectedModel = req.body.model || 'meta-llama/llama-3.2-3b-instruct:free';
const completion = await openai.chat.completions.create({
model: selectedModel,
...
});
🧱 Folder Structure Suggestion
pgsql
Copy
Edit
/routes
peteai.js
intercom.js
/utils
availableModels.json
openrouter.js <-- Feature toggles & presets
grounding.js <-- Cache/DB fetch for user data
/tools
handlers.js <-- API tool definitions
/public
chat.html
🔚 Summary
Feature How to Add
Intercom API access Add OpenRouter function tools OR inject grounding context
Cache/DB grounding Use getCachedData(userId) and inject into prompt
Enable/disable web search Use OpenRouter-Web-Search header
Enable prompt caching Use OpenRouter-Prompt-Caching header
Use response presets Use OpenRouter-Preset header
Dynamic model switching Send selected model from UI, read from availableModels.json

Would you like:

A working backend OpenRouter tool handler system?

A new dropdown UI example for selecting model + checkboxes for toggles?

Redis or simple in-memory cache module to integrate?

Let me know which one you want to build first, and I'll scaffold it step-by-step.

You said:

1. yes make sure your follwoing open router best practices.
2. yes
3. yes explain that to me redis ?

ChatGPT said:
Updated saved memory
Great — let's walk through the full architecture and explain how to wire up Redis, OpenRouter features, and your existing Intercom API + PeteAI setup for a smarter, connected AI agent.

✅ 1. Overview: What We're Building
You want:

A PeteAI agent that can:

Talk to Intercom endpoints

Pull from a cached (Redis) version of those endpoints

Optionally hit your DB for grounding

A frontend that supports:

OpenRouter model switching

Web search toggle

Prompt caching toggle

Preset selection (persona/response style)

✅ 2. OpenRouter Best Practices (Official + Practical)
a. Use function calling where possible
Use OpenRouter's OpenAI-compatible schema for defining tools/functions (functions or tool_choice)

Your Intercom routes (e.g., get_all_contacts, update_training_topic) become LLM-available tools.

b. Web Search, Caching, Presets
You control these features via request headers and the OpenRouter dashboard.

Feature How to Control
🔎 Web Search Header: openrouter-web-search: true
💾 Prompt Caching Header: openrouter-prompt-cache: true
🎭 Preset Behavior Header: openrouter-presets: my-preset-id

Example request with all toggles:

js
Copy
Edit
headers: {
'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
'openrouter-web-search': 'true',
'openrouter-prompt-cache': 'true',
'openrouter-presets': 'concise-support-bot-v1'
}
c. Model Switching
You can send model names dynamically like this:

js
Copy
Edit
model: 'meta-llama/llama-3.2-3b-instruct:free'
In your UI, load options from /utils/availableModels.json and use a <select>.

✅ 3. Caching API Data Using Redis
a. Why Redis?
It's a fast, in-memory key-value store.

Great for caching API responses to avoid rate limits and speed up access.

LLMs can fetch cached data as grounding material instead of re-pinging Intercom.

b. Setup
Install Redis + Library

bash
Copy
Edit
npm install redis
Configure Redis Client

js
Copy
Edit
// utils/redisClient.js
const redis = require('redis');
const client = redis.createClient({
url: process.env.REDIS_URL || 'redis://localhost:6379',
});
client.connect().catch(console.error);
module.exports = client;
Cache Wrapper

js
Copy
Edit
// utils/cache.js
const client = require('./redisClient');

async function getOrSetCache(key, fetchFn, ttl = 3600) {
const cached = await client.get(key);
if (cached) return JSON.parse(cached);

const fresh = await fetchFn();
await client.setEx(key, ttl, JSON.stringify(fresh));
return fresh;
}
module.exports = { getOrSetCache };
Use it in routes

js
Copy
Edit
// Example: get all contacts
const { getOrSetCache } = require('../utils/cache');

router.get('/cached/contacts', async (req, res) => {
try {
const contacts = await getOrSetCache('contacts', () =>
getAllFromIntercom('/contacts', 'contacts')
);
res.json({ contacts });
} catch (err) {
res.status(500).json({ error: err.message });
}
});
✅ 4. Frontend Enhancements (PeteAI UI)
You'll want to:

a. Model Dropdown
html
Copy
Edit
<select id="model-select">

  <option value="meta-llama/llama-3.2-3b-instruct:free">LLaMA 3.2 Free</option>
  <option value="openai/gpt-4o">GPT-4o</option>
</select>
b. Toggles
html
Copy
Edit
<label><input type="checkbox" id="web-search-toggle" /> Web Search</label>
<label><input type="checkbox" id="prompt-cache-toggle" /> Prompt Caching</label>
<label><input type="checkbox" id="preset-concise" /> Use Concise Support Bot Preset</label>
c. Send Options in Request
js
Copy
Edit
const headers = {
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
};

if (document.getElementById('web-search-toggle').checked)
headers['openrouter-web-search'] = 'true';

if (document.getElementById('prompt-cache-toggle').checked)
headers['openrouter-prompt-cache'] = 'true';

if (document.getElementById('preset-concise').checked)
headers['openrouter-presets'] = 'concise-support-bot-v1';

const selectedModel = document.getElementById('model-select').value;
✅ 5. Agent Workflow: Using Intercom Data
You can make PeteAI:

First query Redis cache for grounding context

If not present, fallback to live Intercom fetch

Combine that data in LLM prompt context or structured function calls

Use something like:

js
Copy
Edit
const contacts = await getOrSetCache('contacts', () =>
getAllFromIntercom('/contacts', 'contacts')
);

const completion = await openai.chat.completions.create({
model: selectedModel,
messages: [
{ role: 'system', content: 'You are a support assistant.' },
{ role: 'user', content: `Find the training topic for contact email: ${email}` },
{ role: 'user', content: `Here is all contact data:\n${JSON.stringify(contacts)}` }
],
headers,
});
✅ 6. Security & Rate Limits
Use environment variables for all keys.

Don't let the AI call live Intercom endpoints directly — use your /cached/\* versions if possible.

✅ Summary
Feature Done? Notes
✅ Redis for caching ✅ Using getOrSetCache()
✅ Web search toggle ✅ HTML toggle → header
✅ Prompt cache toggle ✅ Same
✅ Presets support ✅ Via header
✅ Model selection UI ✅ Reads from availableModels.json
✅ LLM uses cache/db ✅ In grounding prompt

Would you like me to generate:

The updated HTML with dropdowns + toggles?

Redis-enabled API routes?

A router-level middleware that auto-loads OpenRouter config from query or headers?

Let me know and I'll build it step-by-step with you.

You said:
yes generate everythgin i am going to be adding this to the agent be sure to be complete in your response dont leave anything up to the imagination show a mermaid digram of how this will work when completed and continue teaching me what we are doing.

ChatGPT said:
Updated saved memory
Absolutely! Let's build out the full stack integration, complete with Redis-backed caching, OpenRouter tooling, model/preset toggles, and an interactive frontend. I'll illustrate the architecture with a Mermaid diagram, walk through every file you'll need, explain what's happening, and continue teaching the concepts 👇

🧱 1. System Architecture (Mermaid Diagram)
mermaid
Copy
Edit
flowchart LR
A[User in Chat UI] --> B[JavaScript Frontend]
B --> C[(Redis Cache)]
B --> D[Backend `/PeteAI/` Route]
D --> E[Intercom API Endpoints (/api/intercom, /api/cached)]
D --> F[OpenRouter]
F --> G(Edge: LLM Model & Features)
style C fill:#f9f,stroke:#333,stroke-width:1px
style E fill:#afa,stroke:#333,stroke-width:1px
style F fill:#ffc,stroke:#333,stroke-width:1px
style G fill:#fcf,stroke:#333,stroke-width:1px
Description:

🧍 User types into the chat UI.

Frontend sends message + user options (model, toggles).

Backend receives request, fetches cache (Redis) for grounding and calls Intercom if needed.

Backend wraps the prompt, tooling, and headers for OpenRouter.

OpenRouter evaluates, optionally uses Web Search, caching, presets, and tools, returns a response.

The result is sent back to the frontend.

🔧 2. Backend Setup
a) Redis Utilities
utils/redisClient.js

js
Copy
Edit
const redis = require('redis');
const client = redis.createClient({
url: process.env.REDIS_URL || 'redis://localhost:6379'
});
client.connect().catch(console.error);
module.exports = client;
utils/cache.js

js
Copy
Edit
const client = require('./redisClient');

async function getOrSetCache(key, fetchFn, ttl = 3600) {
const cached = await client.get(key);
if (cached) return JSON.parse(cached);
const fresh = await fetchFn();
await client.setEx(key, ttl, JSON.stringify(fresh));
return fresh;
}

module.exports = { getOrSetCache };
b) OpenRouter Config Utility
utils/openrouter.js

js
Copy
Edit
const fs = require('fs');
const path = require('path');

function loadModels() {
const file = path.join(\_\_dirname, 'availableModels.json');
return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = { loadModels };
c) Tool Definitions
tools/handlers.js

js
Copy
Edit
const axios = require('axios');
const { getOrSetCache } = require('../utils/cache');

const INTERCOM_BASE = 'http://localhost:4000/api/intercom';

async function fetchAllContacts() {
return await getOrSetCache('contacts', async () => {
const resp = await axios.get(`${INTERCOM_BASE}/all/contacts`);
return resp.data.contacts;
});
}

module.exports = {
fetchAllContacts,
};
d) Updated routes/peteai.js
js
Copy
Edit
const express = require('express');
const OpenAI = require('openai');
const { loadModels } = require('../utils/openrouter');
const { fetchAllContacts } = require('../tools/handlers');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY });

router.post('/', async (req, res) => {
const {
message, model, useWebSearch, usePromptCache, presetId, useIntercomContext
} = req.body;

// Prepare grounding data
let contacts;
if (useIntercomContext) {
contacts = await fetchAllContacts();
}

// Build messages
const systemMsg = 'You are a helpful assistant grounded in user-specific contacts.';
const userMsgs = [
{ role: 'system', content: systemMsg },
{ role: 'user', content: message },
];
if (contacts) {
userMsgs.push({ role: 'system', content: `Contacts data:\n${JSON.stringify(contacts)}` });
}

// Prepare headers
const headers = {};
if (useWebSearch) headers['openrouter-web-search'] = 'true';
if (usePromptCache) headers['openrouter-prompt-cache'] = 'true';
if (presetId) headers['openrouter-presets'] = presetId;

try {
const response = await openai.chat.completions.create({
model,
messages: userMsgs,
headers,
});
res.json({ reply: response.choices[0].message.content });
} catch (err) {
res.status(500).json({ error: err.message });
}
});

module.exports = router;
🌐 3. Updated HTML + Frontend Logic
In your chat HTML (e.g., /public/chat.html):

html
Copy
Edit

<!-- Add inside form area -->

<select id="model-select"></select>
<label><input type="checkbox" id="web-search-toggle" /> Web Search</label>
<label><input type="checkbox" id="prompt-cache-toggle" /> Prompt Cache</label>
<label><input type="checkbox" id="use-intercom-context" /> Include Intercom Context</label>
<select id="preset-select">

  <option value="">Default</option>
  <option value="concise-support-bot-v1">Concise Support Bot</option>
</select>
And script:

js
Copy
Edit
// Load models
fetch('/utils/availableModels.json')
.then(r => r.json())
.then(models => {
const sel = document.getElementById('model-select');
models.forEach(m => {
const opt = document.createElement('option');
opt.value = m.id;
opt.textContent = m.name;
sel.appendChild(opt);
});
});

// Update POST body inside form submit...
const body = {
message,
model: document.getElementById('model-select').value,
useWebSearch: document.getElementById('web-search-toggle').checked,
usePromptCache: document.getElementById('prompt-cache-toggle').checked,
useIntercomContext: document.getElementById('use-intercom-context').checked,
presetId: document.getElementById('preset-select').value || undefined,
};
🧠 4. What's Going On (Teaching Moments)
✅ Redis cache prevents repeated fetches and speeds up performance.

🧩 Tooling: fetchAllContacts() becomes a callable tool for the model.

🔄 Grounding: We inject data contextually so the AI isn't hallucinating.

🎮 Feature toggles allow flexible use of OpenRouter capabilities.

📐 Presets control style/tone (set via OpenRouter dashboard, used by header).

🧠 Model dropdown allows dynamic switching between available LLMs.

✅ 5. Next Steps
You now have fully Integrated:

🟪 Redis caching for grounded data.

🧠 Tool usage and dynamic prompt building.

🔄 Model + feature toggles in the UI.

💡 OpenRouter best practices applied.

📚 6. Quiz & Checkpoint: Understanding Key Parts
What does getOrSetCache do, and why do we use it?

Where do we add openrouter-web-search and why?

How do we pass contacts data to the AI model?

Why is presetId in a <select> dropdown?

What would change if you didn't include Intercom context?

Reply with your answers and any questions before we move to Chapter 4, where we'll implement an in-chat quiz system and improve error handling!
