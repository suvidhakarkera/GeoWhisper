export default function Footer() {
  return (
    <footer className="border-t border-white/10 backdrop-blur-xl bg-slate-900/50 py-12 px-4 md:px-6 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                📍
              </div>
              <span className="text-xl font-bold">GeoWhisper</span>
            </div>
            <p className="text-sm text-slate-400">
              AI-Powered Digital Graffiti Platform with Location-Locked Social Messaging
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Technology</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Next.js 14 + Mapbox</li>
              <li>Spring Boot 3.x + AI</li>
              <li>PostgreSQL + PostGIS</li>
              <li>OpenAI + LangChain4j</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Team</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Sankirthan R - Backend Dev</li>
              <li>Suvidha S Karkera - Backend Dev</li>
              <li>Nishitha Shetty - Frontend Dev</li>
              <li>Nidhi J Bangera - Frontend Dev</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Build Timeline: 12-13 days</li>
              <li>Launch: 3 months</li>
              <li>SOC 2 Compliant & Secure</li>
              <li>GDPR Compliant</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 text-center text-sm text-slate-400">
          <p>© 2025 GeoWhisper. Ready to Transform Location-Based Social Interaction</p>
        </div>
      </div>
    </footer>
  );
}