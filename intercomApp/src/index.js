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
  console.error(`[${new Date().toISOString()}] [${context}]`, err);
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
  try {
    const { component_id, input_values } = req.body;
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
      // Save the new topic
      const topic = input_values?.title;
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
      // Build the full API URL
      const baseUrl = process.env.INTERNAL_API_URL || 'http://localhost:4000';
      const apiUrl = baseUrl.endsWith('/') ? baseUrl + 'api/pete-user-training-topic' : baseUrl + '/api/pete-user-training-topic';
      try {
        console.log(`[SUBMIT save_training_topic] Saving new topic: ${topic}`);
        const axios = require('axios');
        const payload = {
          topic: topic.trim()
        };
        console.log('Payload sent to Intercom:', payload);
        const response = await axios.post(apiUrl, payload, {
          headers: {
            'Intercom-Version': '2.13',
            'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`
          }
        });
        const data = await response.data;
        console.log(`[SUBMIT save_training_topic] Successfully updated topic to: ${data.topic}`);
        response = canvasKit.canvasResponse({
          components: [
            canvasKit.textComponent({
              id: 'success',
              text: `Pete User Training Topic updated to: "${data.topic}"`,
              align: 'center',
              style: 'header'
            })
          ]
        });
        canvasKit.debugCanvasResponse(response, '/submit (save_training_topic)');
        return res.json(response);
      } catch (err) {
        console.error('[SUBMIT save_training_topic] Failed to update or fetch topic:', err.response?.data || err);
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
    console.error('[POST /submit]', err);
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
    console.error('[POST /pete-user-training]', err);
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

// PeteUserTraingTopic: Fetch the latest topic from Intercom custom objects
app.get('/api/pete-user-training-topic', async (req, res) => {
  try {
    // Fetch all instances (first page, 10 per page)
    const url = `https://api.intercom.io/custom_object_instances/PeteUserTraingTopic?page=1&per_page=10`;
    const resp = await axios.get(url, {
      headers: {
        'Intercom-Version': '2.13',
        'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`
      }
    });
    const data = await resp.data;
    const topics = data.data || [];
    if (!topics.length) {
      // No topic exists yet; return null instead of error
      return res.json({ topic: null, external_id: null, external_created_at: null, external_updated_at: null });
    }
    // Sort by external_updated_at or external_created_at
    topics.sort((a, b) => (b.external_updated_at || b.external_created_at) - (a.external_updated_at || a.external_created_at));
    const latest = topics[0];
    console.log('[DEBUG] Latest PeteUserTraingTopic:', latest);
    res.json({
      topic: latest.custom_attributes?.Title,
      external_id: latest.external_id,
      external_created_at: latest.external_created_at,
      external_updated_at: latest.external_updated_at
    });
  } catch (err) {
    console.error('[GET /api/pete-user-training-topic]', err);
    // On error, return null topic (fail gracefully)
    res.json({ topic: null, external_id: null, external_created_at: null, external_updated_at: null });
  }
});

// PeteUserTraingTopic: Always create a new topic in Intercom custom objects (audit/history pattern)
app.post('/api/pete-user-training-topic', async (req, res,) => {
  try {
    const { topic } = req.body;
    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required and must be a non-empty string.' });
    }
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const external_id = uuidv4();
    const payload = {
      external_id,
      external_created_at: now,
      external_updated_at: now,
      custom_attributes: {
        Title: topic.trim()
      }
    };
    console.log('Payload sent to Intercom:', payload);
    const response = await axios.post('https://api.intercom.io/custom_object_instances/PeteUserTraingTopic', payload, {
      headers: {
        'Intercom-Version': '2.13',
        'Authorization': `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.data;
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create PeteUserTraingTopic');
    }
    console.log('[DEBUG] Created PeteUserTraingTopic:', data);
    res.status(201).json({ success: true, topic: data });
  } catch (err) {
    if (err.response) {
      // Log the full response from Intercom
      console.error('[POST /api/pete-user-training-topic] Intercom API error:', err.response.status, err.response.data);
      res.status(500).json({
        error: 'Failed to create PeteUserTraingTopic',
        details: err.response.data // <-- This is the real error from Intercom!
      });
    } else {
      console.error('[POST /api/pete-user-training-topic] Error:', err);
      res.status(500).json({
        error: 'Failed to create PeteUserTraingTopic',
        details: err.message
      });
    }
  }
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/support.html'));
});

app.listen(PORT, () => {
  console.log(`Intercom Canvas Kit onboarding app listening on port ${PORT}`);
});

console.log('Access Token:', process.env.INTERCOM_ACCESS_TOKEN); 