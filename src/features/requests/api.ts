import { supabase } from "../../lib/supabase";

export type RequestStatus = "New" | "Open" | "Assigned" | "In Progress" | "Waiting" | "Resolved" | "Closed";
export type RequestType = "Support" | "Bug" | "Feature Suggestion" | "Question" | "Other";
export type Compensation = "Free" | "Bounty";

export type SupportRequest = {
  id: string;
  title: string;
  status: RequestStatus;
  type: RequestType;
  application: string;
  requester: string;
  bounty: number;
  compensation: Compensation;
  createdAt: string;
  assignedTo: string | null;
  recording: boolean;
  recordingPublic: boolean;
};

type RequestRow = {
  id: string;
  title: string;
  status: string;
  request_type: string;
  bounty_amount: number | string;
  recording_url: string | null;
  recording_visibility: "private" | "public";
  created_at: string;
  application: { name: string } | null;
  requester: { name: string } | null;
  assigned: { name: string } | null;
};

const statusMap: Record<string, RequestStatus> = {
  new: "New", open: "Open", assigned: "Assigned", in_progress: "In Progress", waiting: "Waiting", resolved: "Resolved", closed: "Closed",
};
const typeMap: Record<string, RequestType> = {
  support: "Support", bug: "Bug", feature: "Feature Suggestion", question: "Question", other: "Other",
};

export async function listSupportRequests(): Promise<SupportRequest[]> {
  const { data, error } = await supabase
    .from("support_requests")
    .select(`
      id, title, status, request_type, bounty_amount, recording_url, recording_visibility, created_at,
      application:applications!support_requests_application_id_fkey(name),
      requester:participants!support_requests_requester_id_fkey(name),
      assigned:participants!support_requests_assigned_participant_id_fkey(name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as RequestRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    status: statusMap[row.status] ?? "Open",
    type: typeMap[row.request_type] ?? "Other",
    application: row.application?.name ?? "Unknown application",
    requester: row.requester?.name ?? "Unknown participant",
    bounty: Number(row.bounty_amount) || 0,
    compensation: Number(row.bounty_amount) > 0 ? "Bounty" : "Free",
    createdAt: row.created_at,
    assignedTo: row.assigned?.name ?? null,
    recording: Boolean(row.recording_url),
    recordingPublic: row.recording_visibility === "public",
  }));
}
