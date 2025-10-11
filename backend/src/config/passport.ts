import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { q } from '../config/db.js'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = (Array.isArray(profile.emails) && profile.emails[0]?.value) || ''
        if (!email) return done(new Error('email_not_provided'))
        const gid = profile.id
        const rawName: string = (profile.displayName ?? email.split('@')[0])
        const username = rawName.replace(/\s+/g, '_').toLowerCase()

        const existing = await q('select * from users where google_id=$1 or email=$2', [gid, email])
        let user = existing.rows[0] as any
        if (!user) {
          user = (
            await q(
              'insert into users (email, username, google_id, onboarded, credits) values ($1,$2,$3,false,2000) returning *',
              [email, username, gid],
            )
          ).rows[0]
          const org = (
            await q('insert into orgs (name, owner_id) values ($1,$2) returning *', [`${username} Org`, user.id])
          ).rows[0]
          if (org) {
            await q('insert into user_org_roles (user_id, org_id, role) values ($1,$2,$3)', [user.id, org.id, 'admin'])
          }
        }
        done(null, { id: user.id, email: user.email })
      } catch (e) {
        done(e as any)
      }
    },
  ),
)

export default passport


