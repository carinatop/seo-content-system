import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("brand_samples")
    .select("*")
    .eq("brand_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ samples: data });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.body || String(body.body).trim().length < 50) {
      return NextResponse.json({ error: "Sample body must be at least 50 characters." }, { status: 400 });
    }
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("brand_samples")
      .insert({ brand_id: id, title: body.title ?? null, body: body.body })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sample: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: brandId } = await params;
  const url = new URL(req.url);
  const sampleId = url.searchParams.get("sample_id");
  if (!sampleId) return NextResponse.json({ error: "sample_id required" }, { status: 400 });
  const sb = supabaseAdmin();
  const { error } = await sb.from("brand_samples").delete().eq("id", sampleId).eq("brand_id", brandId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
