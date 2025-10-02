import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
          ✨ Coming Soon
        </div>
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Pete Intercom App
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Intelligent onboarding and customer success automation for Intercom
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {/* Intelligent Onboarding */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              🎯 Smart Onboarding
            </CardTitle>
            <CardDescription className="text-base">
              7-levels deep discovery questionnaire for understanding customer needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/popout">
              <Button className="w-full h-11 text-base">Try Demo</Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Assistant */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              🤖 PeteAI Helper
            </CardTitle>
            <CardDescription className="text-base">
              AI-powered assistance for Intercom data queries and help docs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/help">
              <Button className="w-full h-11 text-base" variant="outline">Get Help</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Help Center */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              📚 Documentation
            </CardTitle>
            <CardDescription className="text-base">
              Complete guides and resources for using Pete
            </CardDescription>
          </CardContent>
          <CardContent>
            <Link href="/help">
              <Button className="w-full h-11 text-base" variant="outline">Browse Docs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Message */}
      <Card className="mt-12 max-w-3xl mx-auto border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl text-center">🚀 Launching Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            We're currently in private beta. Pete will transform how you onboard and support customers in Intercom.
            <br /><br />
            <span className="text-sm">Built with Next.js 15, React 19, and AI-powered insights</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}