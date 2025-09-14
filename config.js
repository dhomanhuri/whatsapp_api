require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    sessionDir: process.env.SESSION_DIR || './sessions',
    apiKey: process.env.API_KEY || 'default_api_key'
};
