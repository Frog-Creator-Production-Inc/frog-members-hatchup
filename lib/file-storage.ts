import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { UserFile } from "@/types/file"

const supabase = createClientComponentClient()
const STORAGE_BUCKET = 'user-documents' // バケット名を定数として定義

export async function uploadFile(file: File, userId: string) {
  try {
    // 1. Storageにファイルをアップロード
    const filePath = `${userId}/${file.name}`

    const { data: storageData, error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // 同名ファイルの上書きを許可
        contentType: file.type // MIMEタイプを明示的に設定
      })

    if (uploadError) {
      throw new Error(`ファイルのアップロードに失敗しました: ${uploadError.message}`)
    }

    if (!storageData) {
      throw new Error('ストレージの応答が不正です')
    }

    // 2. Storageのファイルの公開URLを取得
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET) // 定数を使用
      .getPublicUrl(filePath)

    // 3. user_filesテーブルにレコードを作成
    const { data: fileData, error: dbError } = await supabase
      .from('user_files')
      .insert({
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        user_id: userId
      })
      .select()
      .single()

    if (dbError) {
      // データベースの保存に失敗した場合、アップロードしたファイルを削除
      await supabase
        .storage
        .from(STORAGE_BUCKET) // 定数を使用
        .remove([filePath])
      
      throw new Error('ファイル情報の保存に失敗しました')
    }

    return fileData

  } catch (error) {
    throw error instanceof Error ? error : new Error('アップロードに失敗しました')
  }
}

export async function getUserFiles(userId: string): Promise<UserFile[]> {
  const { data, error } = await supabase
    .from('user_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('ファイル一覧の取得に失敗しました')
  }

  return data || []
}

export async function downloadFile(fileId: string) {
  // まず、ファイルのメタデータを取得
  const { data: fileData, error: fileError } = await supabase
    .from("user_files")
    .select("*")
    .eq("id", fileId)
    .single()

  if (fileError) throw fileError
  if (!fileData) throw new Error("File not found")

  // 次に、実際のファイルをダウンロード
  const { data, error } = await supabase
    .storage
    .from(STORAGE_BUCKET) // 定数を使用
    .download(fileData.path)

  if (error) throw error

  return { data, fileName: fileData.name }
}

export async function getAdminUserFiles(userId: string) {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase
    .from("user_files")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("ファイルの取得に失敗しました")
  }

  return data
}

export async function downloadAndDeleteFile(fileId: string) {
  const supabase = createClientComponentClient()

  // ファイルをダウンロード
  const { data, fileName } = await downloadFile(fileId)

  // ファイルメタデータを削除
  const { error: deleteError } = await supabase.from("user_files").delete().eq("id", fileId)

  if (deleteError) throw deleteError

  // Storageからファイルを削除
  const { error: storageDeleteError } = await supabase.storage.from(STORAGE_BUCKET).remove([fileName])

  if (storageDeleteError) throw storageDeleteError

  return { data, fileName }
}

