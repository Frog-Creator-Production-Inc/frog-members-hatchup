import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { notifyNewVisaPlanMessage } from '@/lib/slack/notifications'
import { formatDate } from '@/lib/utils'

/**
 * 新規ビザプランメッセージをSlackに通知するAPIエンドポイント
 * 非同期で処理し、ビザプランナーのパフォーマンスに影響を与えないようにする
 */
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const requestBody = await req.json()
    
    // 必須パラメータのチェック
    const requiredParams = ['messageId', 'planId', 'userId', 'title', 'content']
    const missingParams = requiredParams.filter(param => !requestBody[param])
    
    if (missingParams.length > 0) {
      return NextResponse.json(
        { error: `Missing required parameters: ${missingParams.join(', ')}` }, 
        { status: 400 }
      )
    }
    
    // ユーザー認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (user.id !== requestBody.userId) {
      return NextResponse.json(
        { error: 'Authenticated user ID does not match the requested user ID' }, 
        { status: 403 }
      )
    }
    
    // ユーザーのメールアドレスを取得
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single()
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }
    
    const { messageId, planId, userId, title, content } = requestBody
    
    // ユーザー名を生成
    const userName = userData.first_name && userData.last_name 
      ? `${userData.first_name} ${userData.last_name}`
      : userData.email || 'Unknown User'
    
    try {
      // 既存の関数を使用
      const success = await notifyNewVisaPlanMessage(
        messageId,
        planId,
        userId,
        userName,
        title,
        content,
        false // isTest=false: 実際に送信する
      )
      
      if (!success) {
        return NextResponse.json(
          { error: 'Failed to send notification' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process visa message notification' },
      { status: 500 }
    )
  }
} 