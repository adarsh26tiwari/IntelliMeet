import React from "react";
import {
  FaEnvelope,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaVideo,
} from "react-icons/fa";
import { APP_CONFIG } from "../utils/constants";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FaVideo className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {APP_CONFIG.APP_NAME}
              </h3>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              {APP_CONFIG.APP_DESCRIPTION}
            </p>

            <div className="flex space-x-4">
              <a
                href={APP_CONFIG.SOCIAL_LINKS.GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Github"
              >
                <FaGithub className="w-5 h-5" />
              </a>

              <a
                href={APP_CONFIG.SOCIAL_LINKS.TWITTER}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <FaTwitter className="w-5 h-5" />
              </a>

              <a
                href={APP_CONFIG.SOCIAL_LINKS.LINKEDIN}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-5 h-5" />
              </a>

              <a
                href={APP_CONFIG.SOCIAL_LINKS.EMAIL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Email"
              >
                <FaEnvelope className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {APP_CONFIG.FOOTER_LINKS.QUICK_LINKS.map((link, index) => (
                <li key={index}>
                  {link.isExternal ? (
                    <a
                      href={link.route}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.route}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {APP_CONFIG.FOOTER_LINKS.SUPPORT_LINKS.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.url}
                    className="hover:text-blue-400 transition-colors"
                    target={link.isExternal ? "_blank" : undefined}
                    rel={link.isExternal ? "noopener noreferrer" : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>
            &copy; {currentYear} {APP_CONFIG.APP_NAME}.{" "}
            {APP_CONFIG.COPYRIGHT_TEXT}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;