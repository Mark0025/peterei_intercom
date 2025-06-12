// Canvas Kit logic for Intercom integrations
// Strictly follows @canvaskit.mdc rules (see README)
// Only use documented Canvas Kit components and properties
// Reference: https://developers.intercom.com/canvas-kit-reference/reference/components

// Helper: Build a simple text component
function textComponent(args) {
  console.log('[CanvasKit] textComponent args:', args);
  return { type: 'text', ...args };
}

// Helper: Build a button component
function buttonComponent(args) {
  console.log('[CanvasKit] buttonComponent args:', args);
  // Map 'open_url' to 'url' for backward compatibility
  const type = args.actionType === 'open_url' ? 'url' : args.actionType;
  const action = { type };
  if (type === 'url' && args.url) {
    action.url = args.url;
    if (args.new_tab) action.new_tab = true;
  }
  return { type: 'button', ...args, action };
}

// Helper: Build an input component
function inputComponent(args) {
  console.log('[CanvasKit] inputComponent args:', args);
  const input = { type: 'input', ...args };
  if (args.required) input.required = true;
  if (args.placeholder) input.placeholder = args.placeholder;
  return input;
}

// Helper: Build a Canvas Kit error response
function errorCanvas({ message }) {
  console.log('[CanvasKit] errorCanvas message:', message);
  const errorObj = {
    canvas: {
      content: {
        components: [
          textComponent({ id: 'error', text: message, style: 'error', align: 'center' })
        ]
      }
    }
  };
  console.log('[CanvasKit] errorCanvas output:', errorObj);
  return errorObj;
}

// Helper: Build a Canvas Kit response
function canvasResponse({ components, stored_data, event }) {
  console.log('[CanvasKit] canvasResponse args:', { components, stored_data, event });
  const response = {
    canvas: {
      content: { components }
    }
  };
  if (stored_data) response.canvas.stored_data = stored_data;
  if (event) response.event = event;
  console.log('[CanvasKit] canvasResponse output:', response);
  return response;
}

// Debug: Log outgoing Canvas Kit responses
function debugCanvasResponse(response, context = '') {
  console.log(`[CanvasKit] debugCanvasResponse${context ? ' (' + context + ')' : ''}:`, JSON.stringify(response, null, 2));
}

module.exports = {
  textComponent,
  buttonComponent,
  inputComponent,
  errorCanvas,
  canvasResponse,
  debugCanvasResponse
}; 