import React from 'react';
import { 
    Zap, 
    Layers, 
    Grid, 
    Activity, 
    Flame, 
    TrendingUp, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Info,
    FileText,
    Wallet
} from 'lucide-react';

export const NOTIFICATION_TYPES = {
    BOT_STARTED: 'BOT_STARTED',
    BOT_STOPPED: 'BOT_STOPPED',
    TEMPLATE_CREATED: 'TEMPLATE_CREATED',
    TEMPLATE_UPDATED: 'TEMPLATE_UPDATED',
    TRADE_OPENED: 'TRADE_OPENED',
    POSITION_CLOSED: 'POSITION_CLOSED',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO',
    SYSTEM: 'SYSTEM',
    ACCOUNT_CONNECTED: 'ACCOUNT_CONNECTED'
};

export const getNotificationIcon = (type) => {
    switch (type) {
        case NOTIFICATION_TYPES.BOT_STARTED:
            return React.createElement(Zap, { size: 16, className: "text-green-400" });
        case NOTIFICATION_TYPES.BOT_STOPPED:
            return React.createElement(XCircle, { size: 16, className: "text-red-400" });
        case NOTIFICATION_TYPES.TEMPLATE_CREATED:
        case NOTIFICATION_TYPES.TEMPLATE_UPDATED:
            return React.createElement(FileText, { size: 16, className: "text-blue-400" });
        case NOTIFICATION_TYPES.TRADE_OPENED:
            return React.createElement(TrendingUp, { size: 16, className: "text-purple-400" });
        case NOTIFICATION_TYPES.POSITION_CLOSED:
            return React.createElement(CheckCircle2, { size: 16, className: "text-emerald-400" });
        case NOTIFICATION_TYPES.ERROR:
            return React.createElement(XCircle, { size: 16, className: "text-red-500" });
        case NOTIFICATION_TYPES.WARNING:
            return React.createElement(AlertTriangle, { size: 16, className: "text-yellow-400" });
        case NOTIFICATION_TYPES.ACCOUNT_CONNECTED:
            return React.createElement(Wallet, { size: 16, className: "text-blue-500" });
        default:
            return React.createElement(Info, { size: 16, className: "text-gray-400" });
    }
};

export const getNotificationLink = (notification) => {
    const { type, metadata } = notification;
    
    switch (type) {
        case NOTIFICATION_TYPES.BOT_STARTED:
            // Route to specific bot page based on strategy if available
            if (metadata?.strategy === 'Grid') return '/grid-trading';
            if (metadata?.strategy === 'DCA') return '/dca-trading';
            if (metadata?.strategy === 'RSI') return '/rsi-bot';
            if (metadata?.strategy === 'Candle Strike') return '/candle-strike-bot';
            return '/price-movement-bot';
            
        case NOTIFICATION_TYPES.TEMPLATE_CREATED:
        case NOTIFICATION_TYPES.TEMPLATE_UPDATED:
            return '/templates';
            
        case NOTIFICATION_TYPES.TRADE_OPENED:
        case NOTIFICATION_TYPES.POSITION_CLOSED:
            return '/'; // Dashboard for positions
            
        case NOTIFICATION_TYPES.ACCOUNT_CONNECTED:
            return '/exchange-accounts';
            
        default:
            return null;
    }
};