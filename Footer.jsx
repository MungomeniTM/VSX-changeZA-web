import React from "react";

function Footer() {
  return (
    <footer className="bg-pitch text-white text-center py-6">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} VSXchange ZA. All Rights Reserved.
      </p>
    </footer>
  );
}

export default Footer;
