import React from "react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-6 bg-gradient-to-r from-blue-500 to-green-400 text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-6">
        Welcome to VSXchange ZA
      </h1>
      <p className="text-lg md:text-xl max-w-2xl mb-8">
        Empowering vocational skills. Connecting builders, creators, and
        coders into one powerful network of collaboration and opportunity.
      </p>
      <Link
        to="/register"
        className="px-8 py-3 bg-gradient-to-r from-black to-pitch rounded-full text-lg font-semibold hover:scale-105 transform transition"
      >
        Join the Movement 🚀
      </Link>
    </section>
  );
}

export default Hero;
