import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { q } from '../config/db.js'
import { z } from 'zod'

const r = Router()
r.use(requireAuth)

r.get('/', async (req, res) => {
  const uid = (req as any).user.id as string
  const orgs = (
    await q(
      `with members as (
         select r.org_id, json_build_object('id', u.id, 'email', u.email, 'role', r.role) as m
         from user_org_roles r
         join users u on u.id = r.user_id
       ), invites as (
         select i.org_id, json_build_object('id', i.id, 'email', i.email, 'role', 'invited') as m
         from org_invites i
       )
       select o.id, o.name,
         json_agg(mm.m order by (mm.m->>'email')) as members
       from orgs o
       join (
         select * from members
         union all
         select * from invites
       ) mm on mm.org_id = o.id
       where exists(select 1 from user_org_roles r2 where r2.user_id=$1 and r2.org_id=o.id)
       group by o.id, o.name
       order by o.created_at desc`,
      [uid],
    )
  ).rows
  const active = (await q('select active_org_id from users where id=$1', [uid])).rows[0]?.active_org_id || null
  res.json({ orgs, activeOrgId: active })
})

r.post('/', async (req, res) => {
  const uid = (req as any).user.id as string
  const name = (req.body?.name as string) || 'New Organization'
  const orgRes = await q('insert into orgs (name, owner_id) values ($1,$2) returning *', [name, uid])
  const org = orgRes.rows[0]
  if (!org) return res.status(500).json({ error: 'org_create_failed' })
  await q('insert into user_org_roles (user_id, org_id, role) values ($1,$2,$3)', [uid, org.id, 'admin'])
  await q('update users set active_org_id=$1 where id=$2', [org.id, uid])
  res.json(org)
})

r.post('/:id/rename', async (req, res) => {
  const uid = (req as any).user.id as string
  const id = req.params.id
  const name = (req.body?.name as string) || 'Organization'
  const ok = await q("select 1 from user_org_roles where user_id=$1 and org_id=$2 and role = 'admin'", [uid, id])
  if (!ok.rowCount) return res.status(403).json({ error: 'forbidden' })
  await q('update orgs set name=$1 where id=$2', [name, id])
  res.json({ ok: true })
})

r.post('/:id/invite', async (req, res) => {
  const uid = (req as any).user.id as string
  const id = req.params.id
  const schema = z.object({ email: z.string().email() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json(parsed.error.flatten())
  const ok = await q("select 1 from user_org_roles where user_id=$1 and org_id=$2 and role = 'admin'", [uid, id])
  if (!ok.rowCount) return res.status(403).json({ error: 'forbidden' })
  const inv = (
    await q('insert into org_invites (org_id, email, invited_by) values ($1,$2,$3) returning *', [id, parsed.data.email, uid])
  ).rows[0]
  res.json(inv)
})

r.post('/:id/members/:memberId/role', async (req, res) => {
  const uid = (req as any).user.id as string
  const { id, memberId } = req.params
  const { role } = req.body as { role: 'admin' | 'member' }
  const ok = await q("select 1 from user_org_roles where user_id=$1 and org_id=$2 and role = 'admin'", [uid, id])
  if (!ok.rowCount) return res.status(403).json({ error: 'forbidden' })
  await q('update user_org_roles set role=$1 where user_id=$2 and org_id=$3', [role, memberId, id])
  res.json({ ok: true })
})

r.delete('/:id/members/:memberId', async (req, res) => {
  const uid = (req as any).user.id as string
  const { id, memberId } = req.params
  const ok = await q("select 1 from user_org_roles where user_id=$1 and org_id=$2 and role = 'admin'", [uid, id])
  if (!ok.rowCount) return res.status(403).json({ error: 'forbidden' })
  await q('delete from user_org_roles where user_id=$1 and org_id=$2', [memberId, id])
  res.json({ ok: true })
})

r.post('/active', async (req, res) => {
  const uid = (req as any).user.id as string
  const { orgId } = req.body as { orgId: string }
  const ok = await q('select 1 from user_org_roles where user_id=$1 and org_id=$2', [uid, orgId])
  if (!ok.rowCount) return res.status(403).json({ error: 'forbidden' })
  await q('update users set active_org_id=$1 where id=$2', [orgId, uid])
  res.json({ ok: true })
})

export default r


