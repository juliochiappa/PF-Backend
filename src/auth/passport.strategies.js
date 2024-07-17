import passport from 'passport';
import local from 'passport-local';
import GitHubStrategy from 'passport-github2';
import jwt from 'passport-jwt';

import config from '../config.js';
import UserManager from '../controllers/usersManager.js';
import { isValidPassword } from '../services/utils.js';

const localStrategy = local.Strategy;
const jwtStrategy = jwt.Strategy;
const jwtExtractor = jwt.ExtractJwt; //Solamente para el uso de las cookies
const manager = new UserManager();

const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) token  = req.cookies ['cookietoken'];

    return token;
}

const initAuthStrategies = () => {

    //Estrategia Local
    passport.use('login', new localStrategy(
        {passReqToCallback: true, usernameField: 'email'},
        async (req, username, password, done) => {
            try {
                const foundUser = await manager.getOne({ email: username });

                if (foundUser && isValidPassword(password, foundUser.password)) {
                    const { password, ...filteredFoundUser } = foundUser;
                    return done(null, filteredFoundUser);
                } else {
                    return done(null, false);
                }
            } catch (err) {
                return done(err, false);
            }
        }
    ));

    //Estrategia de GitHub
    passport.use('ghlogin', new GitHubStrategy( 
        {
            clientID: config.GITHUB_CLIENT_ID,
            clientSecret: config.GITHUB_CLIENT_SECRET,
            callbackURL: config.GITHUB_CALLBACK_URL
        },
        async (req, accessToken, refreshToken, profile, done) => {
           try {
               const emailsList = profile.emails || null;
               let email = profile._json?.email || null;
            if (!emailsList && !email) {
                   const response = await fetch('https://api.github.com/user/emails', {
                       headers: {
                           'Authorization': `token ${accessToken}`,
                           'User-Agent': config.APP_NAME
                       }
                   });
                   const emails = await response.json();
                
                   email = emails.filter(email => email.verified).map(email => ({ value: email.email }));
               }     
                if (email !== null) {
                    const foundUser = await manager.getOne({ email: email });
                   if (!foundUser) {
                        const user = {
                            firstName: profile._json.name.split(' ')[0],
                            lastName: profile._json.name.split(' ')[1],
                            email: email,
                            password: 'none'
                        }
                       const process = await manager.addUser(user);
                       return done(null, process);
                    } else {
                        return done(null, foundUser);
                    }
                } else {
                    return done(new Error('Email no disponible'), null);
                }
            } catch (err) {
                return done(err, false);
            }
        }
    ));

    //Estrategia de JWT vía cookie
    passport.use('jwtlogin', new jwtStrategy(
       {
        jwtFromRequest: jwtExtractor.fromExtractors([cookieExtractor]),
        secretOrKey: config.SECRET
       },
       async (jwt_payload, done) => {
            try{
                return (null, jwt_payload);
            } catch(err){
                return done(err);
            }
        }
        
    ));

    passport.serializeUser((user, done) => {
        done(null, user);
    });
        
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
}

export const passportCall = strategy => {
    return async (req, res, next) => {
        passport.authenticate(strategy, { session: false }, function (err, user, info) {
            if (err) return next(err);
            //if (!user) return res.status(401).send({ origin: config.SERVER, payload: null, error: info.messages ? info.messages : info.toString() });
            if (!user) return res.status(401).send({ origin: config.SERVER, payload: null, error: 'Usuario no autenticado' });

            req.user = user;
            next();
        })(req, res, next);
    }
};

export default initAuthStrategies;
