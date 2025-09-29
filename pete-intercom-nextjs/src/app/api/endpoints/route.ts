import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // List of all available endpoints in the app
  const endpoints = [
    { path: '/', methods: 'GET' },
    { path: '/popout', methods: 'GET' },
    { path: '/peteai', methods: 'GET' },
    { path: '/whatsworking', methods: 'GET' },
    { path: '/admin', methods: 'GET' },
    { path: '/admin/health', methods: 'GET' },
    { path: '/admin/logs', methods: 'GET' },
    { path: '/admin/peteai', methods: 'GET' },
    { path: '/admin/training', methods: 'GET' },
    { path: '/admin/support', methods: 'GET' },
    { path: '/admin/testapi', methods: 'GET' },
    { path: '/api/initialize', methods: 'POST' },
    { path: '/api/submit', methods: 'POST' },
    { path: '/api/PeteAI', methods: 'POST' },
    { path: '/api/endpoints', methods: 'GET' },
    { path: '/api/intercom/admins', methods: 'GET' },
    { path: '/api/intercom/contacts', methods: 'GET' },
    { path: '/api/intercom/companies', methods: 'GET' },
    { path: '/api/intercom/conversations', methods: 'GET' },
    { path: '/api/intercom/me', methods: 'GET' },
  ];

  return NextResponse.json(endpoints);
}