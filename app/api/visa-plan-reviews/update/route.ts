import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { review_id, admin_id_input, admin_comment_input, status_input, completed_at_input } = await request.json()
    
    if (!review_id || !admin_id_input || !admin_comment_input || !status_input) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // 管理者権限のチェック
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // admin_rolesテーブルで管理者かどうかの確認
    const { data: isAdmin } = await supabase
      .from('admin_roles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin role required' },
        { status: 403 }
      )
    }
    
    // ビザプランレビューを更新
    const updateData: Record<string, any> = {
      admin_id: admin_id_input,
      admin_comment: admin_comment_input,
      status: status_input,
      updated_at: new Date().toISOString()
    }
    
    // ステータスが完了の場合は完了日時も設定
    if (status_input === 'completed') {
      updateData.completed_at = completed_at_input || new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('visa_plan_reviews')
      .update(updateData)
      .eq('id', review_id)
    
    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }
    
    // ビザプランのステータスを更新（完了の場合）
    if (status_input === 'completed') {
      // レビューに関連するプランIDを取得
      const { data: reviewData } = await supabase
        .from('visa_plan_reviews')
        .select('plan_id')
        .eq('id', review_id)
        .single()
      
      if (reviewData?.plan_id) {
        await supabase
          .from('visa_plans')
          .update({ 
            status: 'reviewed',
            updated_at: new Date().toISOString()
          })
          .eq('id', reviewData.plan_id)
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'ビザプランレビューが正常に更新されました'
    })
  } catch (error) {
    console.error('Error in API route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 