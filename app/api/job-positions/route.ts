import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // job_positionsテーブルから全ての職種を取得
    const { data, error } = await supabase
      .from("job_positions")
      .select("*")
      .order("title")
    
    if (error) {
      return NextResponse.json({ error: "職種データの取得に失敗しました" }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "予期せぬエラーが発生しました" }, { status: 500 })
  }
} 