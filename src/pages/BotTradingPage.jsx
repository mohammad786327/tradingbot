import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const BotTradingPage = () => {
  const { toast } = useToast();

  const handleFeatureClick = () => {
    toast({
      title: 'Coming Soon',
      description: '🚧 This feature isn\'t implemented yet—but don\'t worry! You can request it in your next prompt! 🚀'
    });
  };

  return (
    <>
      <Helmet>
        <title>Bot Trading - CryptoBot Trading Platform</title>
        <meta name="description" content="Automated cryptocurrency trading with advanced bot strategies and real-time execution" />
      </Helmet>

      <div className="p-6 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-2xl"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Bot size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Bot Trading</h1>
          <p className="text-xl text-gray-400">
            Automated trading features are coming soon. Configure your bots to execute trades based on your templates.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFeatureClick}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200"
          >
            Learn More
          </motion.button>
        </motion.div>
      </div>
    </>
  );
};

export default BotTradingPage;