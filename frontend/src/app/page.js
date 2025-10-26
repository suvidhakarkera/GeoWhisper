'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TfiLocationPin } from "react-icons/tfi";
import { AiOutlineRise } from "react-icons/ai";
import { IoIosPeople } from "react-icons/io";
import { GiPathDistance } from "react-icons/gi";

export default function Home() {
  const [activeNav, setActiveNav] = useState('home');

  const agents = [
    {
      id: 'vibe',
      icon: '✨',
      title: 'Vibe Summarizer',
      subtitle: 'Real-Time Context Intelligence',
      description: 'Reads all recent messages in a zone and synthesizes them into easy-to-read summaries.',
      example: '"People are mostly complaining about the parking and recommending the new food truck."',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'trend',
      icon: '📈',
      title: 'Trend Detector',
      subtitle: 'Activity Intelligence Engine',
      description: 'Monitors message frequency and engagement velocity across the city. Identifies and highlights the most active spots as "Hot Zones".',
      example: 'Finds action in the city with AI-generated explanations.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      id: 'guide',
      icon: '👥',
      title: 'Guide Agent',
      subtitle: 'Context-Aware Welcome System',
      description: 'Automatically greets users upon entering new zones, provides location context, and suggests content based on past interests.',
      example: '"You\'re at a historical site - see what locals have shared"',
      gradient: 'from-blue-500 to-cyan-500'
    }
  ];

  const stats = [
    {  value: '99.9%', label: 'Location Accuracy', icon: <TfiLocationPin /> },
    { value: '3x', label: 'User Engagement', icon: <AiOutlineRise /> },
    { value: '65%', label: 'Retention Rate', icon: <IoIosPeople /> },
    { value: '500m', label: 'Range Radius', icon: <GiPathDistance /> }
  ];
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-24 md:pb-8 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 mt-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
             The Hyperlocal Chat Bubble
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-8">
              Digitize your surroundings with our Agentic AI solution, enabling instant, restricted-range messaging, automated content filtering, and efficient user interaction management
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-xl p-6 h-48 text-white shadow-xl flex flex-col items-center justify-center text-centerbackdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-6 hover:border-violet-400/50 transition-all duration-300"
                
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* AI Agents Section */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Agentic AI Features
            </h2>
            <p className="text-center text-slate-400 mb-12">
              Powered by specialized AI agents solving critical user problems
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-6 hover:border-violet-400/50 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${agent.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg text-3xl`}>
                    {agent.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{agent.title}</h3>
                  <p className="text-sm text-violet-400 mb-3">{agent.subtitle}</p>
                  <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                    {agent.description}
                  </p>
                  <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-slate-300 italic">{agent.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Section */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-2xl p-8 mb-16">
            <h3 className="text-2xl font-bold mb-6">Why businesses choose GeoWhisper:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {['Real-time location visibility', 'Automated AI collaboration', 'Intelligent zone management', 'AI-powered trend forecasting'].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <h4 className="text-xl font-bold mb-4">Recent Platform Updates:</h4>
              <div className="space-y-2 text-slate-400 text-sm">
                <p>• MVP can be built in 12-13 days</p>
                <p>• Full platform launch within 3 months</p>
                <p>• Built on Spring Boot 3.x + Next.js 14</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/50 border-t border-white/10">
        <div className="grid grid-cols-4 gap-1 px-2 py-3">
          {[
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'explore', icon: '🗺️', label: 'Explore' },
            { id: 'agents', icon: '🤖', label: 'Agents' },
            { id: 'profile', icon: '👤', label: 'Profile' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${
                activeNav === item.id
                  ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-400/50'
                  : 'hover:bg-white/5'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className={`text-xs font-medium ${
                activeNav === item.id ? 'text-violet-400' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}