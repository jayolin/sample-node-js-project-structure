import JWT from "jsonwebtoken";
import passport from "passport";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { asValue } from "awilix";
import UnauthorizeError from "errors/unauthorized";
import crypto from "crypto";
import ForbiddenError from "errors/forbidden";
import resourceNotFound from "errors/resourceNotFound";
import moment from "moment-timezone";
import { publishToRabitmq } from "producers";
import InvalidPayloadError from "errors/invalidPayload";
import TimeAgo from "javascript-time-ago";
// Load locale-specific relative date/time formatting rules.
import en from "javascript-time-ago/locale/en";
// Add locale-specific relative date/time formatting rules.
TimeAgo.addLocale(en);
// Create relative date/time formatter.
const timeAgo = new TimeAgo("en-US");

class AuthRepository {
  constructor({ User }) {
    this.User = User;
  }

  initialize() {
    passport.use("jwt", this.getJWTStrategy());
    passport.use("local", this.getLocalStrategy());
    // console.log("authentication strategies initialized");
    return passport.initialize();
  }

  authenticate(callback) {
    passport.authenticate(
      "jwt",
      {
        session: false,
        failWithError: true
      },
      callback
    );
  }

  generateToken(user) {
    let expires = new Date().setDate(new Date().getDate() + 7); // Expires in 7 days
    let token = JWT.sign(
      {
        iss: process.env.JWT_ISSUER, //issuer
        aud: process.env.JWT_AUDIENCE, // audience
        sub: user._id, //subject
        iat: Math.floor(new Date().getTime() / 1000) // issuedAt in seconds
        // exp: Math.floor(expires / 1000) // expiry
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
        // notBefore: 60
      }
    );

    return { token: token, expires, user: user };
  }

  getJWTStrategy() {
    const params = {
      secretOrKey: process.env.JWT_SECRET,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    };

    return new JWTStrategy(params, async (req, payload, done) => {
      try {
        // console.log({ payload });
        const user = await this.User.findById(payload.sub);
        if (!user) {
          return done(
            new UnauthorizeError("Invalid token or token user does not exist"),
            false
          );
        }
        // check if user is active and can use the portal
        if (!user.active) {
          return done(
            new UnauthorizeError(
              "Your account has been deactivated. Please contact admin."
            ),
            false
          );
        }

        // revoke all token generated before user has changed their password
        if (user.password_changed_at) {
          if (payload.iat < user.password_changed_at) {
            return done(
              new UnauthorizeError(
                "Unauthorized. Token revoked because your password was change."
              ),
              false
            );
          }
        }

        // check if user is trying to use the portal without first changing their
        // default password
        if (user.first_time_login && req.url !== "/me/password/change") {
          return done(
            new ForbiddenError(
              "Unauthorized: Please change your password to continue"
            ),
            false
          );
        }

        // inject currentUser into the container
        req.container.register({
          currentUser: asValue(user) // from auth middleware...
        });
        // here check if user has not changed their password and throw an Auth Error
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    });
  }

  getLocalStrategy() {
    return new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
        session: false
      },
      async (req, email, password, done) => {
        try {
          const account_challenge_token = req.body.challenge_token;
          const user = await this.User.findOne({
            email,
            account_challenge_token
          });

          // check if challenged is passed
          if (!user) {
            return done(
              new UnauthorizeError("Challenge failed. Invalid session"),
              false
            );
          }

          // validate password
          const isMatch = await user.isValidPassword(password);

          if (!isMatch) {
            // Password not matched - penalize account

            if (user.login_attempts < this.allow_login_count) {
              user.login_attempts = user.login_attempts + 1;
              await user.save();
            }

            if (user.login_attempts >= this.allow_login_count) {
              user.is_blocked = true;
              // generate reset token
              user.reset_password_token = crypto
                .randomBytes(20)
                .toString("hex");
              // set expiry
              user.reset_password_expires = Date.now() + 10800000; // 3 hours from now
              await user.save();
              // send an Email notifying user of blocked account
              await publishToRabitmq([
                {
                  worker: "email",
                  message: {
                    action: "send",
                    type: "blocked_account",
                    data: {
                      user: {
                        email: user.email,
                        last_name: user.last_name,
                        first_name: user.first_name
                      },
                      context: {
                        token: user.reset_password_token
                      },
                      attachments: [],
                      template_name: "blocked_account",
                      sendAttachment: false,
                      allowReplyTo: false,
                      subject: "Security Alert: Account Locked!"
                    }
                  }
                }
              ]);

              return done(
                new UnauthorizeError(
                  "Your account has been locked. Please reset your password."
                ),
                false
              );
            }

            return done(new UnauthorizeError("Invalid credentials"), false);
          }

          // check if account is blocked
          if (user.is_blocked) {
            return done(
              new UnauthorizeError(
                "Your account has been locked. Please reset your password."
              ),
              false
            );
          }

          // check if user is active and can use the portal
          if (!user.active) {
            return done(
              new UnauthorizeError(
                "Your account has been deactivated. Please contact admin."
              ),
              false
            );
          }

          // update login_times array const _agent = useragent.parse
          const updatedUser = await this.User.findOneAndUpdate(
            {
              _id: user._id
            },
            {
              $push: {
                login_times: {
                  $each: [
                    moment()
                      .tz(process.env.DEFAULT_TIMEZONE)
                      .format()
                  ],
                  $sort: {
                    score: -1
                  },
                  $slice: -2
                }
              },
              $set: {
                login_attempts: 0,
                account_challenge_token: undefined
              }
            },
            {
              runValidators: true,
              new: true
            }
          );

          return done(null, updatedUser);
        } catch (error) {
          return done(error, false);
        }
      }
    );
  }
  /**
   * Helper for resetting password
   * @param {String} email
   */
  forgotPassword(email) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if a user with email address exist
        const user = await this.User.findOne({ email });
        if (!user) {
          resolve({});
          return;
        }
        user.reset_password_token = crypto.randomBytes(20).toString("hex");
        user.reset_password_expires = Date.now() + 10800000; // 3 hours from now
        await user.save();
        // send an email
        await publishToRabitmq([
          {
            worker: "email",
            message: {
              action: "send",
              type: "forgot_password",
              data: {
                user: {
                  email: user.email,
                  last_name: user.last_name,
                  first_name: user.first_name
                },
                context: {
                  token: user.reset_password_token
                },
                attachments: [],
                template_name: "forgot_password",
                sendAttachment: false,
                allowReplyTo: false,
                subject: "Forgot your NCC Demo Portal password?"
              }
            }
          }
        ]);
        resolve({});
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper for verifying reset token
   * @param {String} token
   */
  verifyResetToken(token) {
    return new Promise(async (resolve, reject) => {
      try {
        // check if a user with email address exist
        const user = await this.User.findOne({
          reset_password_token: token,
          reset_password_expires: {
            $gt: Date.now()
          }
        });
        if (!user) {
          throw new ForbiddenError(
            "Password reset token is invalid or has expired"
          );
        }
        resolve({});
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper for verifying reset token
   * @param {Object} payload
   */
  resetPassword(payload) {
    return new Promise(async (resolve, reject) => {
      try {
        const { password, token } = payload;
        // check if a user with email address exist
        let user = await this.User.findOne({
          reset_password_token: token,
          reset_password_expires: {
            $gt: Date.now()
          }
        });
        if (!user) {
          throw new ForbiddenError(
            "Password reset token is invalid or has expired"
          );
        }

        // check if user has used password before
        const old_password = await user.checkOldPassword(password);
        if (old_password) {
          throw new ForbiddenError(
            `Password has previously been used ${timeAgo.format(
              new Date(old_password.changed_at)
            )}. Try another password`
          );
          return;
        }

        user = await user.setPassword(password);
        user.reset_password_token = undefined;
        user.reset_password_expires = undefined;
        // unblock account and reset counter
        user.login_attempts = 0;
        user.is_blocked = false;
        user.first_time_login = false;
        // push password hash to old_passwords
        user.old_passwords.push({
          password: user.password,
          changed_at: new Date()
        });

        user = await user.save();
        // send a password reset successful mail
        await publishToRabitmq([
          {
            worker: "email",
            message: {
              action: "send",
              type: "reset_password",
              data: {
                user: {
                  email: user.email,
                  last_name: user.last_name,
                  first_name: user.first_name
                },
                context: {},
                attachments: [],
                template_name: "reset_password",
                sendAttachment: false,
                allowReplyTo: false,
                subject: "Your NCC Demo password has been reset!"
              }
            }
          }
        ]);

        resolve({});
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper for getting user from token
   * @param {String} token
   */
  getUserFromToken(register_user_token) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await this.User.findOne({ register_user_token });
        if (!user) {
          throw new InvalidPayloadError("Token is invalid");
        }
        resolve({ email: user.email });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Helper for checking if an email exists
   * @param {Object} email
   */
  lookupByEmail(email) {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await this.User.findOne({ email });
        if (!user) {
          throw new resourceNotFound("Couldn't find your  account.");
        }

        // generate secure token
        user.account_challenge_token = crypto.randomBytes(80).toString("hex");
        await user.save();

        resolve({
          account: email,
          challenge_token: user.account_challenge_token,
          accountExists: true,
          continueChallenge: true
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default AuthRepository;
