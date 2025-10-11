import { q } from '../config/db.js'

export async function getCredits(userId: string) {
  const { rows } = await q<{ credits: number }>('select credits from users where id=$1', [userId])
  return rows[0]?.credits ?? 0
}

export async function requireCredits(userId: string) {
  return (await getCredits(userId)) > 0
}

export async function applyUsage(userId: string, promptTokens: number, completionTokens: number) {
  const cost = promptTokens + completionTokens
  await q('update users set credits = credits - $1 where id=$2', [cost, userId])
  await q(
    'insert into credits_ledger (user_id, delta, reason, meta) values ($1,$2,$3,$4)',
    [userId, -cost, 'llm_usage', { promptTokens, completionTokens }],
  )
  return cost
}


