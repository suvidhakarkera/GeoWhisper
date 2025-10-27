'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, TrendingUp, Users, Gauge, Sparkles, BarChart3, UserPlus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const agents = [
    {
      id: 'vibe',
      icon: Sparkles,
      title: 'Vibe Summarizer',
      subtitle: 'Real-Time Context Intelligence',
      description: 'Reads all recent messages in a zone and synthesizes them into easy-to-read summaries.',
      example: '"People are mostly complaining about the parking and recommending the new food truck."'
    },
    {
      id: 'trend',
      icon: BarChart3,
      title: 'Trend Detector',
      subtitle: 'Activity Intelligence Engine',
      description: 'Monitors message frequency and engagement velocity across the city. Identifies and highlights the most active spots as "Hot Zones".',
      example: 'Finds action in the city with AI-generated explanations.'
    },
    {
      id: 'guide',
      icon: UserPlus,
      title: 'Guide Agent',
      subtitle: 'Context-Aware Welcome System',
      description: 'Automatically greets users upon entering new zones, provides location context, and suggests content based on past interests.',
      example: '"You\'re at a historical site - see what locals have shared"'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Location Accuracy', icon: MapPin },
    { value: '3x', label: 'User Engagement', icon: TrendingUp },
    { value: '65%', label: 'Retention Rate', icon: Users },
    { value: '500m', label: 'Range Radius', icon: Gauge }
  ];
 
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              The Hyperlocal Chat Bubble
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              Digitize your surroundings with our Agentic AI solution, enabling instant, restricted-range messaging, automated content filtering, and efficient user interaction management
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <Card key={idx} className="text-center">
                  <CardContent className="pt-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-lg bg-black dark:bg-white">
                        <Icon className="w-6 h-6 text-white dark:text-black" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* AI Agents Section */}
          <div id="features" className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Agentic AI Features
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Powered by specialized AI agents solving critical user problems
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-black dark:bg-white mb-4">
                        <Icon className="w-6 h-6 text-white dark:text-black" />
                      </div>
                      <CardTitle className="text-xl">{agent.title}</CardTitle>
                      <CardDescription>{agent.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {agent.description}
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 border">
                        <p className="text-xs italic">{agent.example}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Why Choose Section */}
          <Card className="mb-20">
            <CardHeader>
              <CardTitle className="text-2xl">Why businesses choose GeoWhisper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {['Real-time location visibility', 'Automated AI collaboration', 'Intelligent zone management', 'AI-powered trend forecasting'].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div>
                <h4 className="text-lg font-semibold mb-4">Recent Platform Updates</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• MVP can be built in 12-13 days</p>
                  <p>• Full platform launch within 3 months</p>
                  <p>• Built on Spring Boot 3.x + Next.js 14</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}