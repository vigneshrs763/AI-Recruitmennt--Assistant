import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || 'your_github_client_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your_github_client_secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/github/callback',
      scope: ['read:user', 'repo']
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email: `${profile.username}@github.local`,
            githubId: profile.id,
            githubUsername: profile.username,
            githubAccessToken: _accessToken
          });
        } else {
          user.githubUsername = profile.username;
          user.githubAccessToken = _accessToken;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
