const { textComponent, buttonComponent, canvasResponse } = require('../intercom/canvasKit');

function waitForRenderResponse() {
  return canvasResponse({
    components: [
      textComponent({
        id: 'wait',
        text: 'The Pete Intercom App is waking up. Please wait a few seconds and refresh.',
        align: 'center',
        style: 'header'
      }),
      buttonComponent({
        id: 'refresh',
        label: 'Refresh',
        style: 'primary',
        actionType: 'submit'
      })
    ]
  });
}

module.exports = { waitForRenderResponse }; 