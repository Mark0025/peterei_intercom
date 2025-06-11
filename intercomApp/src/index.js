require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('intercom-client');
const nodemailer = require('nodemailer');

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
              action: { type: 'submit', value: 'show_popout' }
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
            action: { type: 'submit', value: 'show_popout' }
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
            action: { type: 'submit', value: 'show_popout' }
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
});

// Add /popout-submit route to process the form
app.post('/popout-submit', express.urlencoded({ extended: true }), async (req, res) => {
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
});

// Modify /initialize endpoint to support popout mode and robust error handling
app.post("/initialize", async (req, res) => {
  try {
    const fullForm = req.body.fullForm || req.query.fullForm;
    const popout = req.body.popout || req.query.popout;
    if (popout) {
      // Respond with a Canvas Kit card with a button to open the popout form
      res.json({
        canvas: {
          content: {
            components: [
              {
                type: 'text',
                id: 'popout_intro',
                text: 'Prefer to fill out the full onboarding form in a separate window? Click below to open the form in a new tab.',
                align: 'center',
                style: 'header'
              },
              {
                type: 'button',
                label: 'Open Full Form in New Tab',
                style: 'primary',
                id: 'open_popout',
                action: {
                  type: 'open_url',
                  url: `${process.env.POP_OUT_URL || 'http://localhost:' + (process.env.PORT || 4000) + '/popout'}`,
                  new_tab: true
                }
              }
            ]
          }
        }
      });
      return;
    }
    if (fullForm) {
      const canvas = buildFullFormCanvas();
      res.json(canvas);
      return;
    }
    // Start at first question (step-by-step)
  const canvas = buildQuestionCanvas(0);
  res.json(canvas);
  } catch (err) {
    logError('initialize', err);
    res.status(500).json({ error: 'Failed to initialize onboarding.' });
  }
});

// Canvas Kit submit endpoint (robust, bulletproof logic)
app.post("/submit", async (req, res) => {
  try {
  const { input_values = {}, current_canvas = {} } = req.body;
  const storedData = current_canvas.stored_data || {};
    const isFullForm = storedData.fullForm;
    const showPopout = req.body.component_id === 'show_popout' || req.body.input_values?.show_popout === 'show_popout';

    if (showPopout) {
      // Respond with popout card using Canvas Kit 'popout' component
      res.json({
        canvas: {
          content: {
            components: [
              {
                type: 'popout',
                url: `${process.env.POP_OUT_URL || 'http://localhost:' + (process.env.PORT || 4000) + '/popout'}`,
                title: 'Full Onboarding Form'
              }
            ]
          }
        }
      });
      return;
    }

    if (isFullForm && req.body.component_id === 'submit_full_form') {
      // Collect all answers
      const answers = {};
      allQuestions.forEach((q, idx) => {
        const key = `q_${idx}`;
        if (input_values[key] !== undefined) {
          answers[key] = input_values[key];
        }
      });
      // Send email with results
      try {
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
          subject: 'New Onboarding Form Submission',
          text: Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n')
        };
        await transporter.sendMail(mailOptions);
      } catch (err) {
        logError('email full form', err);
      }
      // Optionally, update Intercom as before (map to company attributes)
      try {
        const intercom = new Client({ token: process.env.INTERCOM_ACCESS_TOKEN });
        const companyId = req.body.contact?.companies?.[0]?.id;
        if (companyId) {
          const customAttributes = {};
          Object.entries(answers).forEach(([key, value]) => {
            customAttributes[key] = value;
          });
          await intercom.companies.update({
            id: companyId,
            custom_attributes: customAttributes
          });
        }
      } catch (err) {
        logError('intercom full form', err);
      }
      res.json({
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
                label: 'Show popout (all questions)',
                style: 'secondary',
                id: 'show_popout',
                action: { type: 'submit', value: 'show_popout' }
              }
            ]
          }
        },
        event: { type: 'completed' }
      });
      return;
    }

    // Step-by-step logic (bulletproof)
  let questionIdx = storedData.questionIdx || 0;
    let answers = storedData.answers || {};
  // Save previous answer
  const prevInputKey = `q_${questionIdx}`;
  const prevAnswer = input_values[prevInputKey];
  if (prevAnswer !== undefined) {
    answers[prevInputKey] = prevAnswer;
  }
  // If user clicked refresh, start over
  if (req.body.component_id === "refresh_button") {
    questionIdx = 0;
    res.json(buildQuestionCanvas(0, { answers: {} }));
    return;
  }
  // Next question
    questionIdx = questionIdx + 1;
    if (questionIdx >= allQuestions.length) {
      // All questions answered, process all answers
      try {
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
          subject: 'New Onboarding Form Submission (Step-by-step)',
          text: Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('\n')
        };
        await transporter.sendMail(mailOptions);
      } catch (err) {
        logError('email step-by-step', err);
      }
      try {
  const intercom = new Client({ token: process.env.INTERCOM_ACCESS_TOKEN });
  const companyId = req.body.contact?.companies?.[0]?.id;
  if (companyId) {
    const customAttributes = {};
    Object.entries(answers).forEach(([key, value]) => {
      customAttributes[key] = value;
    });
      await intercom.companies.update({
        id: companyId,
        custom_attributes: customAttributes
      });
        }
    } catch (err) {
        logError('intercom step-by-step', err);
      }
      res.json({
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
                action: { type: 'submit', value: 'show_popout' }
              }
            ]
          }
        },
        event: { type: 'completed' }
      });
      return;
    }
    // Show next question
    res.json(buildQuestionCanvas(questionIdx, { answers, questionIdx }));
  } catch (err) {
    logError('submit', err);
    res.status(500).json({ error: 'Failed to process onboarding step.' });
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

app.listen(PORT, () => {
  console.log(`Intercom Canvas Kit onboarding app listening on port ${PORT}`);
}); 