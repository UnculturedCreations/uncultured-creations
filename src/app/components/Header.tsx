'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="fixed top-0 w-full bg-white shadow z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-7xl">
        {/* Logo / Brand Name */}
        <Link href="/">
          <span className="text-xl font-bold text-gray-800">Uncultured Creations</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <a href="#about" className="hover:text-purple-600">About</a>
          <a href="#services" className="hover:text-purple-600">Services</a>
          <a href="#portfolio" className="hover:text-purple-600">Portfolio</a>
          <a href="#contact" className="hover:text-purple-600">Contact</a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-800"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white shadow px-4 py-4 space-y-4">
          <a href="#about" className="block text-gray-700 hover:text-purple-600">About</a>
          <a href="#services" className="block text-gray-700 hover:text-purple-600">Services</a>
          <a href="#portfolio" className="block text-gray-700 hover:text-purple-600">Portfolio</a>
          <a href="#contact" className="block text-gray-700 hover:text-purple-600">Contact</a>
        </div>
      )}
    </header>
  );
}
