import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { createOrgApi, inviteMemberApi, loadOrgs, renameOrgApi, setActiveOrgApi, updateMemberRoleApi, removeMemberApi } from '../features/orgs/orgsSlice'

export default function OrgsPage() {
  const { list, activeOrgId } = useAppSelector((s) => s.orgs)
  const dispatch = useAppDispatch()
  const [newOrg, setNewOrg] = useState('')
  const [rename, setRename] = useState('')
  const [invite, setInvite] = useState('')

  const active = list.find((o) => o.id === activeOrgId) || null

  useEffect(() => {
    dispatch(loadOrgs())
  }, [dispatch])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <h2 className="font-medium mb-2 text-neutral-800">Your Organizations</h2>
          <div className="space-y-2">
            {list.map((o) => (
              <button
                key={o.id}
                onClick={() => dispatch(setActiveOrgApi(o.id))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded border ${activeOrgId === o.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-neutral-50 border-neutral-200'} transition-colors`}
              >
                <span>{o.name}</span>
                {activeOrgId === o.id && <span className="text-xs text-indigo-600">Active</span>}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="New organization name" value={newOrg} onChange={(e) => setNewOrg(e.target.value)} />
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow" onClick={() => newOrg && (dispatch(createOrgApi(newOrg)), setNewOrg(''))}>Create</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <h2 className="font-medium mb-2 text-neutral-800">Manage Active Organization</h2>
          {!active && <div className="text-sm text-neutral-500">Select or create an organization</div>}
          {active && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Rename</label>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder={active.name} value={rename} onChange={(e) => setRename(e.target.value)} />
                  <button className="px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition" onClick={() => rename && (dispatch(renameOrgApi({ id: active.id, name: rename })), setRename(''))}>Save</button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Invite Member by Email</label>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="email@example.com" value={invite} onChange={(e) => setInvite(e.target.value)} />
                  <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition shadow" onClick={() => invite && (dispatch(inviteMemberApi({ orgId: active.id, email: invite })), setInvite(''))}>Invite</button>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1 text-neutral-800">Members</div>
                <div className="space-y-2">
                  {active.members.length === 0 && <div className="text-sm text-neutral-500">No members yet</div>}
                  {active.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded border border-neutral-200 gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate text-neutral-800">{m.email}</div>
                        <div className="text-xs text-neutral-500">{m.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="text-sm border border-neutral-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          value={m.role}
                          onChange={(e) => dispatch(updateMemberRoleApi({ orgId: active.id, memberId: m.id, role: e.target.value as any }))}
                          disabled={m.role === 'invited'}
                        >
                          <option value="admin">admin</option>
                          <option value="member">member</option>
                          <option value="invited" disabled>invited</option>
                        </select>
                        <button className="px-3 py-1 rounded-md text-sm border border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => dispatch(removeMemberApi({ orgId: active.id, memberId: m.id }))}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


