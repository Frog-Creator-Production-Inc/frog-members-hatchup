import Image from "next/image"
import Link from "next/link"

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="mb-4">
              <Image 
                src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png" 
                alt="Frog Members Logo" 
                width={150} 
                height={40} 
                className="h-10 w-auto"
              />
            </div>
            <p className="text-gray-400 max-w-md">
              日本人の海外挑戦を当たり前にする。
              あなたの一歩を、私たちがサポートします。
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">サービス</h4>
              <ul className="space-y-2">
                <li><Link href="/#features" className="text-gray-400 hover:text-white transition-colors">特徴</Link></li>
                <li><Link href="/#price" className="text-gray-400 hover:text-white transition-colors">料金</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">会社情報</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="https://frogagent.com/about/company/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors flex items-center">
                    会社概要
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </li>
                <li><Link href="/legal/privacy-policy" className="text-gray-400 hover:text-white transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/legal/terms" className="text-gray-400 hover:text-white transition-colors">利用規約</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">お問い合わせ</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">お問い合わせフォーム</Link></li>
                <li><Link href="/contact/business" className="text-gray-400 hover:text-white transition-colors">企業・学校関係者の方へ</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Frog Members. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 