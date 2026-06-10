import { supabase } from '../supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` };
}

export interface Workspace {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  avatar_url:  string | null;
  owner_id:    string;
  plan:        string;
  created_at:  string;
  members?:    { user_id: string; role: string }[];
}

export interface Project {
  id:           string;
  workspace_id: string;
  name:         string;
  description:  string | null;
  cover_color:  string;
  status:       string;
  owner_id:     string;
  due_date:     string | null;
  created_at:   string;
  tasks?:       { id: string; status: string }[];
}

export type TaskStatus   = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id:           string;
  project_id:   string;
  title:        string;
  description:  string | null;
  status:       TaskStatus;
  priority:     TaskPriority;
  assignee_id:  string | null;
  created_by:   string | null;
  due_date:     string | null;
  sort_order:   number;
  tags:         string[];
  created_at:   string;
  updated_at:   string;
  assignee?:    { username: string | null; avatar_url: string | null } | null;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces`, { headers: h });
  const d = await r.json() as { workspaces: Workspace[] };
  return d.workspaces ?? [];
}

export async function createWorkspace(name: string, description?: string): Promise<Workspace> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces`, {
    method: 'POST', headers: h, body: JSON.stringify({ name, description }),
  });
  return r.json() as Promise<Workspace>;
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces/${id}`, { headers: h });
  return r.ok ? r.json() as Promise<Workspace> : null;
}

export async function getProjects(workspaceId: string): Promise<Project[]> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces/${workspaceId}/projects`, { headers: h });
  const d = await r.json() as { projects: Project[] };
  return d.projects ?? [];
}

export async function createProject(workspaceId: string, data: Partial<Project>): Promise<Project> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces/${workspaceId}/projects`, {
    method: 'POST', headers: h, body: JSON.stringify(data),
  });
  return r.json() as Promise<Project>;
}

export async function getTasks(projectId: string): Promise<Task[]> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces/projects/${projectId}/tasks`, { headers: h });
  const d = await r.json() as { tasks: Task[] };
  return d.tasks ?? [];
}

export async function createTask(projectId: string, data: Partial<Task>): Promise<Task> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces/projects/${projectId}/tasks`, {
    method: 'POST', headers: h, body: JSON.stringify(data),
  });
  return r.json() as Promise<Task>;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const h = await authHeaders();
  const r = await fetch(`${API}/api/workspaces/tasks/${id}`, {
    method: 'PATCH', headers: h, body: JSON.stringify(patch),
  });
  return r.json() as Promise<Task>;
}

export async function deleteTask(id: string): Promise<void> {
  const h = await authHeaders();
  await fetch(`${API}/api/workspaces/tasks/${id}`, { method: 'DELETE', headers: h });
}
