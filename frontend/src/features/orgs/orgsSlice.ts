import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'

export type Member = {
  id: string
  email: string
  name?: string
  role: 'owner' | 'admin' | 'member' | 'invited'
}

export type Organization = {
  id: string
  name: string
  members: Member[]
}

type OrgsState = {
  list: Organization[]
  activeOrgId: string | null
}

const initialState: OrgsState = {
  list: [],
  activeOrgId: null,
}

function persist(state: OrgsState) {
  localStorage.setItem('orgsState', JSON.stringify(state))
}

function restore(): OrgsState | null {
  const raw = localStorage.getItem('orgsState')
  return raw ? (JSON.parse(raw) as OrgsState) : null
}

const restored = restore()

const orgsSlice = createSlice({
  name: 'orgs',
  initialState: restored ?? initialState,
  reducers: {
    createOrg: {
      reducer: (state, action: PayloadAction<Organization>) => {
        state.list.push(action.payload)
        state.activeOrgId = action.payload.id
        persist(state)
      },
      prepare: (name: string) => ({
        payload: { id: nanoid(), name, members: [] } as Organization,
      }),
    },
    renameOrg: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const org = state.list.find((o) => o.id === action.payload.id)
      if (!org) return
      org.name = action.payload.name
      persist(state)
    },
    setActiveOrg: (state, action: PayloadAction<string>) => {
      state.activeOrgId = action.payload
      persist(state)
    },
    inviteMember: {
      reducer: (state, action: PayloadAction<{ orgId: string; member: Member }>) => {
        const org = state.list.find((o) => o.id === action.payload.orgId)
        if (!org) return
        org.members.push(action.payload.member)
        persist(state)
      },
      prepare: (orgId: string, email: string, name?: string) => ({
        payload: { orgId, member: { id: nanoid(), email, name, role: 'invited' as const } },
      }),
    },
    updateMemberRole: (state, action: PayloadAction<{ orgId: string; memberId: string; role: Member['role'] }>) => {
      const org = state.list.find((o) => o.id === action.payload.orgId)
      const member = org?.members.find((m) => m.id === action.payload.memberId)
      if (!member) return
      member.role = action.payload.role
      persist(state)
    },
    removeMember: (state, action: PayloadAction<{ orgId: string; memberId: string }>) => {
      const org = state.list.find((o) => o.id === action.payload.orgId)
      if (!org) return
      org.members = org.members.filter((m) => m.id !== action.payload.memberId)
      persist(state)
    },
  },
})

export const { createOrg, renameOrg, setActiveOrg, inviteMember, updateMemberRole, removeMember } = orgsSlice.actions
export default orgsSlice.reducer


