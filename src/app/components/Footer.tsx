'use client';

import { Facebook, Twitter, Instagram, Mail, Home, Info, Briefcase, Image, Phone } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="font-sans bg-gray-900 text-contrast pt-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Branding */}
        <div>
          <h3 className="text-2xl font-bold text-contrast">Uncultured Creations</h3>
          <p className="text-sm mt-2 text-gray-400">
            Crafting bold brands and digital experiences for creators and startups.
          </p>
        </div>

        {/* Navigation */}
        <div className="text-center">
          <h4 className="font-heading text-lg font-semibold text-contrast mb-3">Explore</h4>
          <ul className="space-y-2 text-sm flex flex-col items-center">
            <li><Link href="/" className="flex items-center hover:text-accent"><Home className="w-4 h-4 mr-2" />Home</Link></li>
            <li><a href="#services" className="flex items-center hover:text-accent"><Briefcase className="w-4 h-4 mr-2" />Services</a></li>
            <li><a href="#portfolio" className="flex items-center hover:text-accent"><Image className="w-4 h-4 mr-2" />Portfolio</a></li>
            <li><a href="#contact" className="flex items-center hover:text-accent"><Phone className="w-4 h-4 mr-2" />Contact</a></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-heading text-lg font-semibold text-contrast mb-3">Connect</h4>
          <div className="flex justify-center md:justify-start gap-4">
            <a href="mailto:hello@uncultured-creations.com" className="hover:text-accent">
              <Mail className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-accent">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-accent">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" className="hover:text-accent">
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-accent text-center text-sm text-contrast mt-10 py-5">
        © {new Date().getFullYear()} Uncultured Creations. All rights reserved.
      </div>
    </footer>
  );
}
