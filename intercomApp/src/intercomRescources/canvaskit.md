| Attribute        | Type   | Capabilities    | Description                                                                                                    |
| ---------------- | ------ | --------------- | -------------------------------------------------------------------------------------------------------------- |
| workspace_id     | String | Messenger Inbox | The workspace ID of the teammate. Attribute is app_id for V1.2 and below.                                      |
| workspace_region | String | Messenger Inbox | The Intercom hosted region that this app is located in.                                                        |
| admin            | Object | Inbox           | The Intercom teammate (admin) viewing the conversation.                                                        |
| component_id     | String | Messenger Inbox | The id of the component clicked by the teammate to trigger the request.                                        |
| context          | Object | Messenger       | The context of where the app is added, where the user last visited, and information on the Messenger settings. |
| conversation     | Object | Inbox           | The conversation where your app is being shown.                                                                |
| current_canvas   | Object | Messenger Inbox | The current_canvas the teammate can see.                                                                       |
| customer         | Object | Inbox           | The contact which is currently being viewed by the teammate in the conversation details panel.                 |
| input_values     | Object | Messenger Inbox | A list of key/value pairs of data, inputted by the teammate on the current canvas.                             |
| user             | Object | Messenger       | The user who took the action.                                                                                  |
