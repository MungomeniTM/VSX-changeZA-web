import React from "react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="min-h-[80vh] flex flex-col justify-center items-center text-center px-6 bg-gradient-to-br from-blue to-lightgreen text-white">
      <h1 className="text-4xl md:text-6xl font-bold mb-6">
        Welcome to VSXchange ZA
      </h1>
      <p className="max-w-2xl text-lg md:text-xl mb-8">
        Empowering vocational skills. Connecting workers, creators, and clients
        from builders to coders into one powerful network of collaboration and
        opportunity.
      </p>
      <Link
        to="/register"
        className="bg-gradient-to-r from-blue to-lightgreen px-8 py-4 rounded-full text-lg font-semibold hover:opacity-90 hover:-translate-y-1 transition"
      >
        Join the Movement
      </Link>
    </section>
  );
};

export default Hero;
