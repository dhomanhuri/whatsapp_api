require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionDir: process.env.SESSION_DIR || './sessions',
    apiKey: process.env.API_KEY || 'default_api_key',
    
    // Webhook configuration
    webhook: {
        url: process.env.WEBHOOK_URL || null,
        secret: process.env.WEBHOOK_SECRET || null,
        enabled: process.env.WEBHOOK_ENABLED === 'true',
        retryAttempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
        timeout: parseInt(process.env.WEBHOOK_TIMEOUT) || 5000
    }
};
