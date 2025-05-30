
"use client";

import { motion } from 'framer-motion';
import { FaHeart, FaCode, FaCoffee, FaGithub, FaLinkedin, FaInstagram, FaCat, FaDog } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="py-4 relative overflow-hidden border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center space-x-2">
              <FaCat className="text-xl text-primary" />
              <FaCat className="text-xl text-primary" />
            </div>

            <div className="text-muted-foreground flex items-center gap-2">
            <span>Made with</span>
            <span className="inline-flex gap-2 text-primary">
              <FaCode className="animate-pulse" />
              <FaCoffee className="animate-pulse" />
              <FaHeart className="animate-pulse" />
            </span>
          </div>
            
            <div className="flex items-center space-x-2">
              <FaDog className="text-xl text-primary" />
              <FaDog className="text-xl text-primary" />
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-3">
            <a
              href="https://github.com/chatbca/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-foreground transition-colors"
              aria-label="GitHub Profile"
            >
              <FaGithub className="text-xl" />
            </a>
            <a
              href="https://www.linkedin.com/in/neelanjan-v"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-foreground transition-colors"
              aria-label="LinkedIn Profile"
            >
              <FaLinkedin className="text-xl" />
            </a>
            <a
              href="https://www.instagram.com/neelanjan.v.08?igsh=aDBxdXBibmVyaHB2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-foreground transition-colors"
              aria-label="Instagram Profile"
            >
              <FaInstagram className="text-xl" />
            </a>
          </div>

          <p className="text-xs text-muted-foreground/80 pt-1">
            © {new Date().getFullYear()} KnowNV – Know Neelanjan V.
          </p>
        </motion.div>
      </div>

      {/* Background Elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full filter blur-[100px] -z-10" />
    </footer>
  );
};

export default Footer;
