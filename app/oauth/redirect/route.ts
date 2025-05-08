import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: NextRequest) {
  try {
    console.log('OAuthリダイレクト処理開始');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const serviceName = searchParams.get('state')?.toLowerCase() || '';
    
    console.log(`認証コード受信: ${code ? '正常' : '不明'}, サービス: ${serviceName}`);
    
    if (!code) {
      console.error('認証コードが見つかりません');
      return NextResponse.redirect(new URL('/dashboard?error=nocode', request.url));
    }
    
    if (!serviceName) {
      console.error('サービス名が見つかりません');
      return NextResponse.redirect(new URL('/dashboard?error=noservice', request.url));
    }
    
    // Supabaseクライアントを初期化
    const supabase = createRouteHandlerClient<Database>({ cookies });
    console.log('Supabaseクライアント初期化完了');
    
    // セッションを取得
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('認証されていないユーザー');
      return NextResponse.redirect(new URL('/login?error=notauthenticated', request.url));
    }
    
    console.log('認証済みユーザー:', session.user.id);
    
    // 特定のOAuth処理を実行
    if (serviceName === 'content_snare') {
      try {
        console.log('Content Snareトークン交換開始');
        
        // トークン交換を実行
        const tokenResponse = await fetch('https://api.contentsnare.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: process.env.CONTENT_SNARE_CLIENT_ID,
            client_secret: process.env.CONTENT_SNARE_CLIENT_SECRET,
            code,
            redirect_uri: process.env.CONTENT_SNARE_REDIRECT_URI
          })
        });
        
        console.log('トークン交換レスポンスステータス:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('トークン交換エラー:', errorData);
          return NextResponse.redirect(new URL('/dashboard?error=tokenexchange', request.url));
        }
        
        const tokenData = await tokenResponse.json();
        console.log('トークン取得成功:', {
          access_token_exists: !!tokenData.access_token,
          refresh_token_exists: !!tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_in: tokenData.expires_in
        });
        
        // 既存のContent Snareトークンを削除
        console.log('既存のContent Snareトークンを削除中...');
        try {
          const { error: deleteError } = await supabase
            .from('refresh_tokens')
            .delete()
            .eq('service_name', 'content_snare');
            
          if (deleteError) {
            console.error('トークン削除エラー:', deleteError);
          } else {
            console.log('既存のトークンを削除しました');
          }
        } catch (deleteException) {
          console.error('トークン削除例外:', deleteException);
        }
        
        // リフレッシュトークンテーブルをチェック
        console.log('テーブル一覧を取得中...');
        try {
          const { data: tableList, error: tableError } = await supabase
            .from('refresh_tokens')
            .select('id')
            .limit(1);
            
          if (tableError) {
            console.error('テーブル確認エラー:', tableError);
          } else {
            console.log('テーブル確認成功:', { tableExists: true });
          }
        } catch (tableCheckError) {
          console.error('テーブル確認例外:', tableCheckError);
        }
        
        // 新しいContent Snareトークンを直接挿入
        console.log('新しいContent Snareトークンを作成します');
        try {
          const { data: insertData, error: insertError } = await supabase
            .from('refresh_tokens')
            .insert({
              service_name: 'content_snare',
              refresh_token: tokenData.refresh_token,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id');
            
          if (insertError) {
            console.error('トークン挿入エラー:', insertError);
            // エラーがあっても続行
            console.log('トークン挿入エラーを無視して続行');
          } else {
            console.log('トークン挿入成功:', insertData);
          }
        } catch (insertException) {
          console.error('トークン挿入例外:', insertException);
          // 例外があっても続行
          console.log('トークン挿入例外を無視して続行');
        }
        
        // rawSQLを使用してトークンを直接挿入（緊急代替手段）
        try {
          console.log('SQL直接実行によるトークン挿入を試みます');
          const { data: sqlData, error: sqlError } = await supabase.rpc('insert_content_snare_token', {
            token_value: tokenData.refresh_token
          });
          
          if (sqlError) {
            console.error('SQL実行エラー:', sqlError);
          } else {
            console.log('SQL実行成功:', sqlData);
          }
        } catch (sqlException) {
          console.error('SQL実行例外:', sqlException);
        }
        
        // 一時的なアクセストークンをメモリに保存（開発環境用）
        process.env.CONTENT_SNARE_TEMP_ACCESS_TOKEN = tokenData.access_token;
        console.log('一時アクセストークンを環境変数に保存しました');
        
        console.log('Content Snare認証完了');
        return NextResponse.redirect(new URL('/dashboard?success=auth_content_snare', request.url));
      } catch (error) {
        console.error('Content Snare認証エラー:', error);
        return NextResponse.redirect(new URL('/dashboard?error=contentsnare', request.url));
      }
    }
    
    // その他のOAuthサービス向けに拡張可能
    
    return NextResponse.redirect(new URL('/dashboard?error=unsupported', request.url));
  } catch (error) {
    console.error('OAuthリダイレクト処理エラー:', error);
    return NextResponse.redirect(new URL('/dashboard?error=general', request.url));
  }
} 