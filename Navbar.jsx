import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-black sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <div className="text-2xl font-bold">
          <Link to="/" className="text-blue">VSXchange ZA</Link>
        </div>

        {/* Desktop Nav */}
        <nav className={`hidden md:flex gap-6`}>
          <Link to="/" className="text-white hover:text-lightgreen">Home</Link>
          <a href="#services" className="text-white hover:text-lightgreen">Services</a>
          <a href="#explore" className="text-white hover:text-lightgreen">Explore</a>
          <a href="#about" className="text-white hover:text-lightgreen">About</a>
          <a href="#contact" className="text-white hover:text-lightgreen">Contact</a>
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex">
          <Link
            to="/login"
            className="border-2 border-blue text-blue px-4 py-2 rounded-xl font-semibold hover:bg-blue hover:text-white transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="ml-3 bg-gradient-to-r from-blue to-lightgreen text-white px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden flex flex-col gap-1.5"
          onClick={() => setOpen(!open)}
        >
          <span className="w-7 h-0.5 bg-white"></span>
          <span className="w-7 h-0.5 bg-white"></span>
          <span className="w-7 h-0.5 bg-white"></span>
        </button>

        {/* Mobile Menu */}
        {open && (
          <div className="absolute top-16 right-6 bg-black rounded-lg shadow-lg w-52 p-4 flex flex-col gap-4 md:hidden">
            <a href="#home" className="text-white hover:text-lightgreen">Home</a>
            <a href="#services" className="text-white hover:text-lightgreen">Services</a>
            <a href="#explore" className="text-white hover:text-lightgreen">Explore</a>
            <a href="#about" className="text-white hover:text-lightgreen">About</a>
            <a href="#contact" className="text-white hover:text-lightgreen">Contact</a>
            <Link to="/login" className="text-blue font-semibold">Login</Link>
            <Link to="/register" className="text-lightgreen font-semibold">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
