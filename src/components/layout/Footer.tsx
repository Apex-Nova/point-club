import { Link } from 'react-router-dom';
import { Pencil, Heart } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Pricing',    href: '/pricing'    },
    { label: 'Games',      href: '/games'      },
    { label: 'World',      href: '/world'      },
  ],
  Company: [
    { label: 'About',    href: '/about' },
    { label: 'Contact',  href: '#'      },
    { label: 'Blog',     href: '#'      },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-cream-dark mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-lavender flex items-center justify-center">
                <Pencil size={16} className="text-white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-800">
                Point Club
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Draw together. Think together. A collaborative space for creative minds around the world.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-800 mb-4 text-sm uppercase tracking-wider">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-gray-500 text-sm hover:text-lavender-dark transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-cream-dark mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© 2025 Point Club. All rights reserved.</p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Made with <Heart size={14} className="text-coral" fill="currentColor" /> for creative minds
          </p>
        </div>
      </div>
    </footer>
  );
}
