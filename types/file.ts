export interface UserFile {
  id: string
  name: string
  size: number
  type: string
  path: string
  user_id: string
  downloaded: boolean
  created_at: string
}

export interface FileUploadResponse {
  path: string
  id: string
}

