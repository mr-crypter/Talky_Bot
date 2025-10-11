import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { createOrg, inviteMember, renameOrg, setActiveOrg } from '../features/orgs/orgsSlice'

export default function OrgsPage() {
  const { list, activeOrgId } = useAppSelector((s) => s.orgs)
  const dispatch = useAppDispatch()
  const [newOrg, setNewOrg] = useState('')
  const [rename, setRename] = useState('')
  const [invite, setInvite] = useState('')

  const active = list.find((o) => o.id === activeOrgId) || null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">Organizations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium mb-2">Your Organizations</h2>
          <div className="space-y-2">
            {list.map((o) => (
              <button
                key={o.id}
                onClick={() => dispatch(setActiveOrg(o.id))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded ${activeOrgId === o.id ? 'bg-indigo-50' : 'hover:bg-neutral-50'} border`}
              >
                <span>{o.name}</span>
                {activeOrgId === o.id && <span className="text-xs text-indigo-600">Active</span>}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input className="flex-1 px-3 py-2 rounded border" placeholder="New organization name" value={newOrg} onChange={(e) => setNewOrg(e.target.value)} />
            <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={() => newOrg && (dispatch(createOrg(newOrg)), setNewOrg(''))}>Create</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium mb-2">Manage Active Organization</h2>
          {!active && <div className="text-sm text-neutral-500">Select or create an organization</div>}
          {active && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Rename</label>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded border" placeholder={active.name} value={rename} onChange={(e) => setRename(e.target.value)} />
                  <button className="px-3 py-2 rounded bg-neutral-900 text-white" onClick={() => rename && (dispatch(renameOrg({ id: active.id, name: rename })), setRename(''))}>Save</button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">Invite Member by Email</label>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded border" placeholder="email@example.com" value={invite} onChange={(e) => setInvite(e.target.value)} />
                  <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={() => invite && (dispatch(inviteMember(active.id, invite)), setInvite(''))}>Invite</button>
                </div>
              </div>

              <div>
                <div className="font-medium mb-1">Members</div>
                <div className="space-y-2">
                  {active.members.length === 0 && <div className="text-sm text-neutral-500">No members yet</div>}
                  {active.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded border">
                      <div>
                        <div className="font-medium text-sm">{m.email}</div>
                        <div className="text-xs text-neutral-500">{m.role}</div>
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


