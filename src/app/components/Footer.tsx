'use client';

import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10 mt-20">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Branding */}
        <div>
          <h3 className="text-2xl font-bold text-white">Uncultured Creations</h3>
          <p className="text-sm mt-2 text-gray-400">
            Crafting bold brands and digital experiences for creators and startups.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:text-white">Home</a></li>
            <li><a href="#services" className="hover:text-white">Services</a></li>
            <li><a href="#portfolio" className="hover:text-white">Portfolio</a></li>
            <li><a href="#contact" className="hover:text-white">Contact</a></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">Connect</h4>
          <div className="flex justify-center md:justify-start gap-4">
            <a href="mailto:hello@uncultured-creations.com" className="hover:text-white">
              <Mail className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-white">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="text-center text-sm text-gray-500 mt-10">
        © {new Date().getFullYear()} Uncultured Creations. All rights reserved.
      </div>
    </footer>
  );
}
