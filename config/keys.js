require('dotenv').config();

module.exports = {
    google: {
      clientID:process.env.GOOGLE_CLIENT_ID,
      clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    },
    // session: {
    //   cookieKey: 'YOUR_SESSION_COOKIE_KEY'
    // },
    mongodb: {
      dbURI: 'mongodb://localhost:27017/yourDatabase',
    }
  };
  