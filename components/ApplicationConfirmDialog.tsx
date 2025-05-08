'use client'

import { useState } from 'react'
import { AlertTriangle, HelpCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'

interface ApplicationConfirmDialogProps {
  courseName: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ApplicationConfirmDialog({ 
  courseName, 
  isOpen, 
  onClose, 
  onConfirm 
}: ApplicationConfirmDialogProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>申請プロセスの確認</DialogTitle>
        </DialogHeader>
        
        <div className="py-3">
          <p className="text-sm">
            「{courseName}」への申請を行う前に、下記の重要事項をご確認ください
          </p>
        </div>
        
        <div className="bg-amber-50 p-4 rounded-md mb-4">
          <div className="flex items-center gap-2 mb-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-medium">申請を開始すると、以下のプロセスが進行します</h3>
          </div>
          
          <div className="space-y-3 pl-7">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium">学校への通知</span>
                <p className="text-xs text-gray-600">申請内容は学校側およびシステム管理者に通知されます</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium">提出期限</span>
                <p className="text-xs text-gray-600">申請後、7日以内に必要書類の提出が必要です</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium">キャンセルについて</span>
                <p className="text-xs text-gray-600">一度申請を開始すると、学校側との調整が必要となり、キャンセルが困難になります</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-md cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
          <div className="w-5 h-5 border rounded flex items-center justify-center mt-0.5 flex-shrink-0" style={{ backgroundColor: termsAccepted ? '#4f46e5' : 'white' }}>
            {termsAccepted && <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>}
          </div>
          <span className="text-sm">上記の重要事項を確認し、同意します</span>
        </div>
        
        <DialogFooter className="sm:justify-end gap-2 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!termsAccepted}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            申請を確定する
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 