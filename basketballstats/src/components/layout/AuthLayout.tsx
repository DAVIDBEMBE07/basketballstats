
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  linkText?: string;
  linkTo?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  linkText,
  linkTo = '/'
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-4xl grid gap-6 md:grid-cols-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Image/Logo Section */}
        <div className="relative hidden md:block bg-primary p-6">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full text-center"
            >
              <div className="mb-6">
                <AspectRatio ratio={1 / 1} className="w-36 h-36 mx-auto bg-white/90 rounded-full flex items-center justify-center">
                  <img 
                    src="/lovable-uploads/38118120-09fa-4517-944d-da150da09728.png" 
                    alt="Basketball Stats Logo" 
                    className="w-28 h-28 object-contain"
                  />
                </AspectRatio>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Basketball Stats</h2>
              <p className="text-white/90">
                Suivez les performances de vos joueurs et menez votre équipe vers la victoire
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Form Section */}
        <div className="p-6 flex flex-col">
          <div className="md:hidden mb-6 flex justify-center">
            <AspectRatio ratio={1 / 1} className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <img 
                src="/lovable-uploads/38118120-09fa-4517-944d-da150da09728.png" 
                alt="Basketball Stats Logo" 
                className="w-20 h-20 object-contain"
              />
            </AspectRatio>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              {subtitle && <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
            
            {children}
            
            {linkText && linkTo && (
              <div className="mt-6 text-center">
                <Link to={linkTo} className="text-primary hover:underline">
                  {linkText}
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
