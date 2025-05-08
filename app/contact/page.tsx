"use client"

import LandingLayout from "@/app/components/LandingLayout"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useEffect, useState, useRef } from "react"

export default function ContactPage() {
  // クライアントサイドでのみレンダリングするためのフラグ
  const [isMounted, setIsMounted] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    if (isMounted && formContainerRef.current) {
      // フォームコンテナが存在する場合のみスクリプトを挿入
      const script = document.createElement('script');
      script.src = 'https://www.cognitoforms.com/f/seamless.js';
      script.setAttribute('data-key', 'Hx8E5t38z0aPsTDTTLBGew');
      script.setAttribute('data-form', '3');
      
      // 既存のスクリプトがあれば削除
      const existingScript = formContainerRef.current.querySelector('script');
      if (existingScript) {
        existingScript.remove();
      }
      
      formContainerRef.current.innerHTML = '';
      formContainerRef.current.appendChild(script);
    }
  }, [isMounted]);

  return (
    <LandingLayout>
      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-4">お問い合わせ</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Frog Membersに関するご質問やご相談がございましたら、以下のフォームからお気軽にお問い合わせください。
            担当者より折り返しご連絡いたします。
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg pt-8 pb-10 px-4 mb-8 overflow-hidden">
          <div className="flex justify-center">
            <div className="w-full max-w-[600px]">
              <div 
                ref={formContainerRef}
                className="cognito-form-container"
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
              ></div>
              <style jsx global>{`
                .cognito {
                  width: 100% !important;
                  max-width: 100% !important;
                  overflow: hidden !important;
                }
                .cognito form, 
                .cognito .c-forms-form, 
                .cognito .c-forms-form-body, 
                .cognito .c-field, 
                .cognito .c-field-container,
                .cognito input[type="text"],
                .cognito input[type="email"],
                .cognito textarea,
                .cognito select {
                  width: 100% !important;
                  max-width: 100% !important;
                }
                .cognito table {
                  width: 100% !important;
                  max-width: 100% !important;
                  table-layout: fixed !important;
                }
                .cognito table td {
                  width: auto !important;
                  display: block !important;
                }
                .cognito .c-forms-form .c-editor,
                .cognito .c-forms-form .c-button-section {
                  width: 100% !important;
                  max-width: 100% !important;
                }
              `}</style>
            </div>
          </div>
        </div>
        
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">その他のお問い合わせ方法</h2>
          <p className="mb-4">
            上記フォーム以外にも、以下の方法でお問い合わせいただけます。
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>メール: <a href="mailto:info@frogagent.com" className="text-primary hover:underline">info@frogagent.com</a></li>
            <li>電話: +1 (604) 262-6447</li>
          </ul>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2">企業・学校関係者の方へ</h3>
            <p className="text-blue-700">
              企業や学校関係者の方は、<Link href="/contact/business" className="text-primary font-medium hover:underline">こちらの専用フォーム</Link>からお問い合わせください。
            </p>
          </div>
        </div>
      </div>
    </LandingLayout>
  )
} 