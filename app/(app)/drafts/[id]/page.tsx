"use client";
import { use } from "react";
import Workspace from "./Workspace";

export default function DraftDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Workspace pieceId={id} />;
}
