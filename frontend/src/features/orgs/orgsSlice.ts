import { createSlice, nanoid, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../lib/api'

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

export const loadOrgs = createAsyncThunk('orgs/load', async () => {
  const { data } = await api.get('/orgs')
  return data as { orgs: Organization[]; activeOrgId: string | null }
})

export const createOrgApi = createAsyncThunk('orgs/create', async (name: string) => {
  const { data } = await api.post('/orgs', { name })
  return data as { id: string; name: string }
})

export const renameOrgApi = createAsyncThunk('orgs/rename', async ({ id, name }: { id: string; name: string }) => {
  await api.post(`/orgs/${id}/rename`, { name })
  return { id, name }
})

export const inviteMemberApi = createAsyncThunk('orgs/invite', async ({ orgId, email }: { orgId: string; email: string }) => {
  const { data } = await api.post(`/orgs/${orgId}/invite`, { email })
  return { orgId, invite: data as any }
})

export const setActiveOrgApi = createAsyncThunk('orgs/active', async (orgId: string) => {
  await api.post('/orgs/active', { orgId })
  return orgId
})

export const updateMemberRoleApi = createAsyncThunk('orgs/updateRole', async ({ orgId, memberId, role }: { orgId: string; memberId: string; role: 'admin' | 'member' }) => {
  await api.post(`/orgs/${orgId}/members/${memberId}/role`, { role })
  return { orgId, memberId, role }
})

export const removeMemberApi = createAsyncThunk('orgs/removeMember', async ({ orgId, memberId }: { orgId: string; memberId: string }) => {
  await api.delete(`/orgs/${orgId}/members/${memberId}`)
  return { orgId, memberId }
})

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
  extraReducers: (builder) => {
    builder
      .addCase(loadOrgs.fulfilled, (state, action) => {
        state.list = action.payload.orgs
        state.activeOrgId = action.payload.activeOrgId
        persist(state)
      })
      .addCase(createOrgApi.fulfilled, (state, action) => {
        state.list.push({ id: action.payload.id, name: action.payload.name, members: [] })
        state.activeOrgId = action.payload.id
        persist(state)
      })
      .addCase(renameOrgApi.fulfilled, (state, action) => {
        const org = state.list.find((o) => o.id === action.payload.id)
        if (org) org.name = action.payload.name
        persist(state)
      })
      .addCase(inviteMemberApi.fulfilled, (state, action) => {
        const org = state.list.find((o) => o.id === action.payload.orgId)
        if (org) org.members.push({ id: action.payload.invite.id, email: action.payload.invite.email, role: 'invited' })
        persist(state)
      })
      .addCase(updateMemberRoleApi.fulfilled, (state, action) => {
        const org = state.list.find((o) => o.id === action.payload.orgId)
        const m = org?.members.find((m) => m.id === action.payload.memberId)
        if (m) m.role = action.payload.role
        persist(state)
      })
      .addCase(removeMemberApi.fulfilled, (state, action) => {
        const org = state.list.find((o) => o.id === action.payload.orgId)
        if (org) org.members = org.members.filter((m) => m.id !== action.payload.memberId)
        persist(state)
      })
      .addCase(setActiveOrgApi.fulfilled, (state, action) => {
        state.activeOrgId = action.payload
        persist(state)
      })
  },
})

export const { createOrg, renameOrg, setActiveOrg, inviteMember, updateMemberRole, removeMember } = orgsSlice.actions
export default orgsSlice.reducer


