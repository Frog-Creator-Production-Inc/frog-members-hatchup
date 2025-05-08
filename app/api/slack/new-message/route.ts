import { NextRequest, NextResponse } from 'next/server'
import { WebClient } from '@slack/web-api'

/**
 * WebClient APIを使用したSlackへのチャットメッセージ通知
 * この関数はサーバーサイドでのみ動作します
 */
export async function POST(req: NextRequest) {
  try {
    // リクエストを解析
    const body = await req.json()
    const { userId, messageContent, sender, receiver, messageId, channelId } = body
    
    // 必須パラメータをチェック
    if (!userId || !messageContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // 環境変数をチェック
    const token = process.env.SLACK_BOT_TOKEN
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'SLACK_BOT_TOKEN is not configured' },
        { status: 500 }
      )
    }
    
    const slackChannelId = process.env.SLACK_NOTIFICATION_CHANNEL_ID
    if (!slackChannelId) {
      return NextResponse.json(
        { success: false, error: 'SLACK_NOTIFICATION_CHANNEL_ID is not configured' },
        { status: 500 }
      )
    }
    
    // WebClientを初期化
    const client = new WebClient(token)
    
    // メッセージテキストを構築
    const text = `🔔 新しいチャットメッセージが届きました`
    
    // メッセージブロックを作成
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${text}*`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*送信者:*\n${sender || 'ユーザー'}`,
          },
          {
            type: "mrkdwn",
            text: `*受信者:*\n${receiver || 'FROG管理者'}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*メッセージ:*\n${messageContent}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `<https://frog-members.vercel.app/dashboard|ダッシュボードを開く>`,
          },
        ],
      },
    ]
    
    // メッセージIDとチャンネルIDが指定されている場合はリンクを追加
    if (messageId && channelId) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `<https://frog-members.vercel.app/dashboard/chat/${channelId}|このチャットを確認する>`,
          },
        ],
      })
    }
    
    // Slackにメッセージを送信
    await client.chat.postMessage({
      channel: slackChannelId,
      text,
      blocks,
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 