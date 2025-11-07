'use client';

import { motion } from 'framer-motion';
import { Sparkles, Shield, TrendingUp, MapPin, Zap, Globe, Users, MessageSquare, Lock, Compass, Link } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {

  if (typeof window !== 'undefined') {
    console.log(sessionStorage.getItem('zonesVisited'));
  }
  return (
    <div className="min-h-screen bg-black text-white transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent"></div>
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          ></div>
          {/* Glow Effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">AI-Powered Local Communities</span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight leading-tight">
              Your Voice,
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400/70 via-blue-400/70 to-blue-400/70">
                Your Location
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
              Drop digital graffiti, discover local vibes, and chat with AI agents that know your neighborhood better than anyone else.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-2 border-gray-700 hover:border-cyan-500 rounded-xl font-bold text-lg transition-all"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Explore the Map
                </span>
                <div className="absolute inset-0 bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-sm border-2 border-gray-700 hover:border-cyan-500 rounded-xl font-bold text-lg transition-all"
              >
                Learn More
              </motion.button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">500m</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Range Radius</div>
              </div>
              <div className="text-center border-x border-gray-800">
                <div className="text-4xl font-bold text-cyan-400 mb-2">AI</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Local Agents</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
                <div className="text-sm text-gray-500 uppercase tracking-wide">Active</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Powered by Intelligent AI
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every location has its own AI guardian, moderator, and community manager
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Sparkles className="w-10 h-10" />}
              title="Local AI Agents"
              description="Smart AI personalities that understand the unique culture, events, and conversations happening in your exact location."
              features={["Context-aware responses", "Learning communities", "Hyper-local knowledge"]}
              delay={0.1}
            />
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10" />}
              title="Vibe Summarizer"
              description="Get instant insights into what's trending, what people are talking about, and the overall mood of your area in real-time."
              features={["Sentiment analysis", "Trend detection", "Community pulse"]}
              delay={0.2}
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Smart Moderator"
              description="AI-powered content moderation keeps conversations respectful, safe, and spam-free without heavy-handed censorship."
              features={["Auto-moderation", "Spam detection", "Community safety"]}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How GeoWhisper Works
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Three simple steps to join hyper-local conversations
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines - Desktop Only */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            
            <StepCard
              number="01"
              icon={<Compass className="w-8 h-8" />}
              title="Drop Your Pin"
              description="Share your location and see what's happening within 500 meters of you"
              delay={0.1}
            />
            <StepCard
              number="02"
              icon={<MessageSquare className="w-8 h-8" />}
              title="Post & Discover"
              description="Leave messages, read local posts, and engage with your immediate community"
              delay={0.2}
            />
            <StepCard
              number="03"
              icon={<Zap className="w-8 h-8" />}
              title="Chat with AI"
              description="Get insights, summaries, and local recommendations from your area's AI agent"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Why GeoWhisper */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Why Choose
                <br />
                <span className="text-cyan-400">GeoWhisper?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Unlike global social networks, GeoWhisper creates intimate, location-specific communities where every conversation matters and AI enhances the experience.
              </p>
              
              <div className="space-y-6">
                <BenefitItem
                  icon={<Globe className="w-6 h-6 text-cyan-400" />}
                  title="Hyper-Local Focus"
                  description="Only see and interact with content from your immediate surroundings"
                />
                <BenefitItem
                  icon={<Lock className="w-6 h-6 text-cyan-400" />}
                  title="Privacy First"
                  description="Your exact location stays private. Posts are anonymous yet authentic"
                />
                <BenefitItem
                  icon={<Users className="w-6 h-6 text-cyan-400" />}
                  title="Real Communities"
                  description="Build genuine connections with people who share your physical space"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 p-8 backdrop-blur-sm">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-32 h-32 text-cyan-400 mx-auto mb-6" />
                    <p className="text-2xl font-bold text-cyan-400">500 Meter Radius</p>
                    <p className="text-gray-400 mt-2">Your hyperlocal community zone</p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-12 backdrop-blur-sm"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Whisper?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands discovering what's happening right around them. Your location. Your community. Your AI agent.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-black/20 backdrop-blur-lg border-2 border-gray-600 text-white hover:border-cyan-500 rounded-xl font-bold text-lg transition-all"
            >
              Get Started Now
            </motion.button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description,
  features,
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  features: string[];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8 }}
      className="group p-8 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 hover:border-cyan-500/50 transition-all backdrop-blur-sm"
    >
      <div className="mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-gray-400 mb-6 leading-relaxed">
        {description}
      </p>
      <ul className="space-y-2">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
  delay
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative text-center"
    >
      <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full blur-xl"></div>
        <div className="relative w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-800 border border-cyan-500/30 rounded-full flex items-center justify-center">
          <div className="text-cyan-400">
            {icon}
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold text-sm">
          {number}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function BenefitItem({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
        {icon}
      </div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
