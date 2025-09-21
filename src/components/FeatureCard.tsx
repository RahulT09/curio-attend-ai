import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  buttonText?: string;
  className?: string;
}

const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  buttonText = "Learn More",
  className = ""
}: FeatureCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        <CardHeader>
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {buttonText && (
          <CardContent className="pt-0">
            <Button variant="outline" className="w-full" onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}>
              {buttonText}
            </Button>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};

export default FeatureCard;