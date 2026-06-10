import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-20 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="text-9xl mb-6">🎨</div>
        <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-5xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-sm mx-auto">
          Looks like this canvas is blank. Let's get you back to somewhere creative.
        </p>
        <Link to="/">
          <Button variant="primary" size="lg">Back to Home</Button>
        </Link>
      </motion.div>
    </div>
  );
}
