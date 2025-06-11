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
    res.json({
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'welcome',
              text: 'Welcome to Pete Intercom App! Choose an action below:',
              align: 'center',
              style: 'header'
            },
            {
              type: 'button',
              label: 'Open Full Onboarding Form',
              style: 'primary',
              id: 'open_popout',
              action: {
                type: 'open_url',
                url: 'https://peterei-intercom.onrender.com/popout',
                new_tab: true
              }
            },
            {
              type: 'button',
              label: 'Pete User Training',
              style: 'secondary',
              id: 'open_training',
              action: {
                type: 'submit',
                value: 'pete_user_training'
              }
            }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[POST /initialize]', err);
    res.json({
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'error',
              text: 'Something went wrong: ' + (err.message || err),
              style: 'error',
              align: 'center'
            }
          ]
        }
      }
    });
  }
});

// /submit can just return the same card for now (or handle future actions)
app.post('/submit', (req, res) => {
  try {
    const { component_id, input_values, value } = req.body;
    if (component_id === 'open_training' || value === 'pete_user_training') {
      // Show the Pete User Training form
      return res.json({
        canvas: {
          content: {
            components: [
              {
                type: 'text',
                id: 'training_intro',
                text: 'Update Pete User Training Topic',
                align: 'center',
                style: 'header'
              },
              {
                type: 'input',
                id: 'title',
                label: 'Title',
                input_type: 'text',
                required: true
              },
              {
                type: 'input',
                id: 'external_id',
                label: 'External ID',
                input_type: 'text',
                required: true
              },
              {
                type: 'input',
                id: 'external_created_at',
                label: 'Created At (YYYY-MM-DD)',
                input_type: 'text',
                required: true
              },
              {
                type: 'input',
                id: 'external_updated_at',
                label: 'Updated At (YYYY-MM-DD)',
                input_type: 'text',
                required: true
              },
              {
                type: 'button',
                label: 'Save Training Topic',
                style: 'primary',
                id: 'save_training_topic',
                action: { type: 'submit', value: 'save_training_topic' }
              }
            ]
          }
        }
      });
    }
    if (component_id === 'save_training_topic' || value === 'save_training_topic') {
      // Here you would call the Intercom API to update PeteUserTraingTopic
      // For now, just simulate success
      return res.json({
        canvas: {
          content: {
            components: [
              {
                type: 'text',
                id: 'success',
                text: 'Pete User Training Topic updated!',
                align: 'center',
                style: 'header'
              }
            ]
          }
        }
      });
    }
    // Default: show main card
    res.json({
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'welcome',
              text: 'Welcome to Pete Intercom App! Choose an action below:',
              align: 'center',
              style: 'header'
            },
            {
              type: 'button',
              label: 'Open Full Onboarding Form',
              style: 'primary',
              id: 'open_popout',
              action: {
                type: 'open_url',
                url: 'https://peterei-intercom.onrender.com/popout',
                new_tab: true
              }
            },
            {
              type: 'button',
              label: 'Pete User Training',
              style: 'secondary',
              id: 'open_training',
              action: {
                type: 'submit',
                value: 'pete_user_training'
              }
            }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[POST /submit]', err);
    res.json({
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'error',
              text: 'Something went wrong: ' + (err.message || err),
              style: 'error',
              align: 'center'
            }
          ]
        }
      }
    });
  }
});

// New endpoint for Canvas Kit to open Pete User Training
app.post('/pete-user-training', (req, res) => {
  try {
    res.json({
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
                type: 'open_url',
                url: 'https://peterei-intercom.onrender.com/peteTraining.html',
                new_tab: true
              }
            }
          ]
        }
      }
    });
  } catch (err) {
    console.error('[POST /pete-user-training]', err);
    res.json({
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              id: 'error',
              text: 'Something went wrong: ' + (err.message || err),
              style: 'error',
              align: 'center'
            }
          ]
        }
      }
    });
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
  // Handle Intercom event notifications here
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Intercom Canvas Kit onboarding app listening on port ${PORT}`);
}); 