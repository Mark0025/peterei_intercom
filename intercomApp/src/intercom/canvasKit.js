// Canvas Kit logic for Intercom integrations
// Strictly follows @canvaskit.mdc rules (see README)
// Only use documented Canvas Kit components and properties
// Reference: https://developers.intercom.com/canvas-kit-reference/reference/components

// Helper: Build a simple text component
function textComponent({ id, text, align = 'left', style = 'body' }) {
  return { type: 'text', id, text, align, style };
}

// Helper: Build a button component
function buttonComponent({ id, label, style = 'primary', actionType = 'submit', url, new_tab }) {
  const action = { type: actionType };
  if (actionType === 'open_url' && url) {
    action.url = url;
    if (new_tab) action.new_tab = true;
  }
  return { type: 'button', id, label, style, action };
}

// Helper: Build an input component
function inputComponent({ id, label, input_type = 'text', required = false, placeholder }) {
  const input = { type: 'input', id, label, input_type };
  if (required) input.required = true;
  if (placeholder) input.placeholder = placeholder;
  return input;
}

// Helper: Build a Canvas Kit error response
function errorCanvas({ message }) {
  return {
    canvas: {
      content: {
        components: [
          textComponent({ id: 'error', text: message, style: 'error', align: 'center' })
        ]
      }
    }
  };
}

// Helper: Build a Canvas Kit response
function canvasResponse({ components, stored_data, event }) {
  const response = {
    canvas: {
      content: { components }
    }
  };
  if (stored_data) response.canvas.stored_data = stored_data;
  if (event) response.event = event;
  return response;
}

module.exports = {
  textComponent,
  buttonComponent,
  inputComponent,
  errorCanvas,
  canvasResponse
}; 