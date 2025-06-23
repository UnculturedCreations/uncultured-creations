'use client';

import { useState } from 'react';
import {
  Menu,
  X,
  Info,
  Briefcase,
  Image as ImageIcon,
  Phone
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="fixed top-0 w-full bg-gray-900 z-50 font-sans">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center max-w-7xl">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-2" aria-label="Go to homepage">
          <Image
            src="/images/ucLogo.png"
            alt="Uncultured Creations Logo"
            width={53}
            height={50}
            priority
          />
          <span className="text-xl font-bold text-contrast">Uncultured Creations</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6 text-contrast font-medium">
          <a href="#about" className="flex items-center hover:text-accent">
            <Info className="w-4 h-4 mr-2" />
            About
          </a>
          <a href="#services" className="flex items-center hover:text-accent">
            <Briefcase className="w-4 h-4 mr-2" />
            Services
          </a>
          <a href="#portfolio" className="flex items-center hover:text-accent">
            <ImageIcon className="w-4 h-4 mr-2" />
            Portfolio
          </a>
          <a href="#contact" className="flex items-center hover:text-accent">
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-contrast"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 shadow px-4 py-4 space-y-4 text-contrast">
          <a href="#about" className="flex items-center text-base hover:text-accent">
            <Info className="w-4 h-4 mr-2" />
            About
          </a>
          <a href="#services" className="flex items-center text-base hover:text-accent">
            <Briefcase className="w-4 h-4 mr-2" />
            Services
          </a>
          <a href="#portfolio" className="flex items-center text-base hover:text-accent">
            <ImageIcon className="w-4 h-4 mr-2" />
            Portfolio
          </a>
          <a href="#contact" className="flex items-center text-base hover:text-accent">
            <Phone className="w-4 h-4 mr-2" />
            Contact
          </a>
        </div>
      )}
    </header>
  );
}
