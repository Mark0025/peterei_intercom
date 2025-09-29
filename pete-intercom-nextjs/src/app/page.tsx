import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3 pb-4">
        <h1 className="text-4xl font-bold tracking-tight">Pete Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your Intercom workspace, users, and training topics
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Training Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📚 Training Management
            </CardTitle>
            <CardDescription className="text-base">
              View and update user training topics across all Intercom users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/training">
              <Button className="w-full h-11 text-base">Manage Training Topics</Button>
            </Link>
          </CardContent>
        </Card>

        {/* API Testing */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              🔌 API Testing
            </CardTitle>
            <CardDescription className="text-base">
              Test Intercom API endpoints and view responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/testapi">
              <Button className="w-full h-11 text-base" variant="outline">Test API</Button>
            </Link>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📊 System Logs
            </CardTitle>
            <CardDescription className="text-base">
              View application logs and debug information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/logs">
              <Button className="w-full h-11 text-base" variant="outline">View Logs</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Onboarding Form */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📋 Onboarding
            </CardTitle>
            <CardDescription className="text-base">
              Full onboarding form for browser testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/popout">
              <Button className="w-full h-11 text-base" variant="outline">Open Form</Button>
            </Link>
          </CardContent>
        </Card>

        {/* What's Working */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              ✅ What&apos;s Working
            </CardTitle>
            <CardDescription className="text-base">
              View successful features and system status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/whatsworking">
              <Button className="w-full h-11 text-base" variant="outline">View Status</Button>
            </Link>
          </CardContent>
        </Card>

        {/* PeteAI */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              🤖 PeteAI
            </CardTitle>
            <CardDescription className="text-base">
              AI-powered assistance and automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/peteai">
              <Button className="w-full h-11 text-base" variant="outline">Open PeteAI</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              💬 Conversation History
            </CardTitle>
            <CardDescription className="text-base">
              View analytics, trends, and search all Intercom conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/conversations">
              <Button className="w-full h-11 text-base">View Conversations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl">🚀 System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-base">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span className="text-green-600">✅ Running</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Environment:</span>
              <span className="text-muted-foreground">Development</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Stack:</span>
              <span className="text-muted-foreground">Next.js 15 + React 19 + TypeScript</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">UI:</span>
              <span className="text-muted-foreground">shadcn/ui + Tailwind CSS v4</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}