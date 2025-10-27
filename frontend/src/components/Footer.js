import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  return (
    <footer className="border-t-2 border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-black dark:bg-white">
                <MapPin className="w-5 h-5 text-white dark:text-black" />
              </div>
              <span className="text-lg font-bold">GeoWhisper</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-Powered Digital Graffiti Platform with Location-Locked Social Messaging
            </p>
          </div>

          {/* Technology */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Technology</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Next.js 14 + Mapbox</li>
              <li>Spring Boot 3.x + AI</li>
              <li>PostgreSQL + PostGIS</li>
              <li>OpenAI + LangChain4j</li>
            </ul>
          </div>

          {/* Team */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Team</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Sankirthan R - Backend Dev</li>
              <li>Suvidha S Karkera - Backend Dev</li>
              <li>Nishitha Shetty - Frontend Dev</li>
              <li>Nidhi J Bangera - Frontend Dev</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Build Timeline: 12-13 days</li>
              <li>Launch: 3 months</li>
              <li>SOC 2 Compliant & Secure</li>
              <li>GDPR Compliant</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p> 2025 GeoWhisper. Ready to Transform Location-Based Social Interaction</p>
        </div>
      </div>
    </footer>
  );
}