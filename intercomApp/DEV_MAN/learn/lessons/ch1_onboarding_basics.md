# Chapter 1: Intercom Canvas Kit Onboarding – The Basics

## What is the Intercom Canvas Kit?

The Intercom Canvas Kit is a UI framework for building custom apps inside Intercom. It uses a JSON-based model to describe UI components, forms, and flows. All UI is described using Canvas Kit's documented components and properties—never custom HTML or JavaScript.

## The Request/Response Model

Every interaction between Intercom and your app is a POST request:

- **Initialize**: Intercom sends a request when the app is opened. Your app responds with a Canvas Kit JSON object describing what to show.
- **Submit**: When a user interacts (e.g., submits a form), Intercom sends another POST. Your app processes the input and responds with the next Canvas Kit JSON.

## Example Onboarding Flow (Canvas Kit JSON)

Below is a sample onboarding flow that follows Intercom best practices:

```json
{
  "canvas": {
    "content": [
      {
        "type": "text",
        "text": "Welcome to the onboarding flow! Please enter your details to get started."
      },
      {
        "type": "form",
        "id": "onboarding-form",
        "fields": [
          {
            "type": "input",
            "id": "name",
            "label": "Your Name",
            "placeholder": "Enter your name",
            "required": true
          },
          {
            "type": "input",
            "id": "email",
            "label": "Email Address",
            "placeholder": "Enter your email",
            "required": true,
            "inputType": "email"
          }
        ],
        "buttons": [
          {
            "type": "submit",
            "label": "Continue"
          }
        ]
      }
    ]
  }
}
```

**Best Practices Followed:**

- Only documented Canvas Kit components are used (`text`, `form`, `input`, `submit`).
- The response is wrapped in a `canvas` object with a `content` array.
- All fields are clearly labeled and required fields are marked.
- No custom scripts or external libraries are used.
- The flow is simple, clear, and actionable.

## Key Takeaways

- Always use only approved Canvas Kit components.
- Validate the Intercom signature on every request.
- Keep onboarding flows simple and accessible.
- Store only necessary data using `stored_data` if needed.
- Comment your code and reference the Canvas Kit documentation where appropriate.

---

_For more details, see the [Intercom Canvas Kit Reference](https://developers.intercom.com/canvas-kit-reference/reference/components)._
