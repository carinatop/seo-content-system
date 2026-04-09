import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const brand = url.searchParams.get("brand");
  const status = url.searchParams.get("status");
  const sb = supabaseAdmin();
  let q = sb.from("content_pieces").select("*").order("created_at", { ascending: false });
  if (brand) q = q.eq("brand_id", brand);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pieces: data });
}

export async function POST(req: Request) {
  const body = await req.json();
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("content_pieces")
    .insert({
      brand_id: body.brand_id,
      topic_id: body.topic_id ?? null,
      content_type: body.content_type ?? "blog_seo",
      title: body.title,
      target_keyword: body.target_keyword ?? null,
      secondary_keywords: body.secondary_keywords ?? [],
      word_count_target: body.word_count_target ?? 1500,
      due_date: body.due_date ?? null,
      status: "idea",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ piece: data });
}
