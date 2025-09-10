import React, { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-black sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-blue-500 tracking-wide hover:text-green-400 transition"
        >
          VSXchange ZA
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-white hover:text-green-400 transition">
            Home
          </Link>
          <Link to="/services" className="text-white hover:text-green-400 transition">
            Services
          </Link>
          <Link to="/explore" className="text-white hover:text-green-400 transition">
            Explore
          </Link>
          <Link to="/about" className="text-white hover:text-green-400 transition">
            About
          </Link>
          <Link to="/contact" className="text-white hover:text-green-400 transition">
            Contact
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex space-x-4">
          <Link
            to="/login"
            className="px-5 py-2 border-2 border-blue-500 text-blue-500 font-semibold rounded-lg hover:bg-blue-500 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-green-400 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex flex-col space-y-1"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="w-6 h-0.5 bg-white"></span>
          <span className="w-6 h-0.5 bg-white"></span>
          <span className="w-6 h-0.5 bg-white"></span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-black px-6 py-4 space-y-4">
          <Link to="/" className="block text-white hover:text-green-400">
            Home
          </Link>
          <Link to="/services" className="block text-white hover:text-green-400">
            Services
          </Link>
          <Link to="/explore" className="block text-white hover:text-green-400">
            Explore
          </Link>
          <Link to="/about" className="block text-white hover:text-green-400">
            About
          </Link>
          <Link to="/contact" className="block text-white hover:text-green-400">
            Contact
          </Link>
          <hr className="border-gray-700" />
          <Link
            to="/login"
            className="block text-blue-500 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="block text-green-400 hover:text-white transition"
          >
            Sign Up
          </Link>
        </div>
      )}
    </header>
  );
}

export default Navbar;
