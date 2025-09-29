// Canvas Kit Types - For Intercom Messenger Components

export interface CanvasKitTextComponent {
  type: 'text';
  id: string;
  text: string;
  align?: 'left' | 'center' | 'right';
  style?: 'header' | 'error' | 'muted' | 'paragraph';
}

export interface CanvasKitInputComponent {
  type: 'input';
  id: string;
  label: string;
  placeholder?: string;
  input_type?: 'text' | 'email' | 'number' | 'password';
  required?: boolean;
  disabled?: boolean;
  value?: string;
}

export interface CanvasKitTextareaComponent {
  type: 'textarea';
  id: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
}

export interface CanvasKitButtonAction {
  type: 'submit' | 'url';
  url?: string;
  new_tab?: boolean;
}

export interface CanvasKitButtonComponent {
  type: 'button';
  id: string;
  label: string;
  style?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  action: CanvasKitButtonAction;
}

export interface CanvasKitListComponent {
  type: 'list';
  id: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    image_url?: string;
    action?: CanvasKitButtonAction;
  }>;
}

export type CanvasKitComponent = 
  | CanvasKitTextComponent
  | CanvasKitInputComponent 
  | CanvasKitTextareaComponent
  | CanvasKitButtonComponent
  | CanvasKitListComponent;

export interface CanvasKitContent {
  components: CanvasKitComponent[];
}

export interface CanvasKitCanvas {
  content: CanvasKitContent;
  stored_data?: Record<string, unknown>;
}

export interface CanvasKitResponse {
  canvas: CanvasKitCanvas;
  event?: {
    type: string;
    [key: string]: unknown;
  };
}

export interface CanvasKitRequest {
  component_id?: string;
  input_values?: Record<string, string>;
  stored_data?: Record<string, unknown>;
  context?: {
    user?: {
      id: string;
      email?: string;
      name?: string;
    };
    conversation?: {
      id: string;
    };
  };
}

// Canvas Kit Form Submission Types for Server Actions
export interface CanvasKitFormData {
  componentId?: string;
  inputValues: Record<string, string>;
  storedData?: Record<string, unknown>;
  userId?: string;
}