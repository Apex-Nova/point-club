import { motion } from 'framer-motion';
import { Heart, Pencil, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-lavender-light text-lavender-dark text-sm font-semibold mb-4">
            Our Story
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-5xl font-bold text-gray-800 mb-6">
            We Believe in Creative Collaboration
          </h1>
          <p className="text-gray-500 text-xl leading-relaxed">
            Point Club was born from a simple idea: creativity is better when shared.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Heart, title: 'Made with Love', desc: 'Every pixel crafted for the joy of creating together.' },
            { icon: Globe, title: 'Global Community', desc: 'Connecting creatives from every corner of the world.' },
            { icon: Pencil, title: 'Always Improving', desc: 'Constantly evolving based on what our community needs.' },
          ].map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl p-8 text-center shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-lavender-light flex items-center justify-center mx-auto mb-4">
                <Icon size={22} className="text-lavender-dark" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="bg-white rounded-3xl p-12 shadow-sm"
        >
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-500 leading-relaxed text-lg">
            Drawing and visual thinking are universal languages. Point Club exists to make real-time creative collaboration accessible to everyone — whether you're a professional designer, a student doodling in class, or a team planning your next big idea.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
