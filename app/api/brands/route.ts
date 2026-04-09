import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const DEFAULT_WORKSPACE_NAME = "Default Workspace";

async function ensureWorkspace() {
  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from("workspaces")
    .select("id")
    .eq("name", DEFAULT_WORKSPACE_NAME)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await sb
    .from("workspaces")
    .insert({ name: DEFAULT_WORKSPACE_NAME })
    .select("id")
    .single();
  if (error) throw new Error("workspace create: " + error.message);
  return created!.id;
}

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sb = supabaseAdmin();
    const workspace_id = await ensureWorkspace();

    const { data, error } = await sb
      .from("brands")
      .insert({
        workspace_id,
        name: body.name,
        niche: body.niche ?? null,
        audience_json: body.audience ?? {},
        tone_json: body.tone ?? {},
        voice_rules_json: body.voice_rules ?? {},
        commercial_json: body.commercial ?? {},
        seo_notes: body.seo_notes ?? null,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ brand: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
