import Image from "next/image"

interface MascotBubbleProps {
  message: string
}

export function MascotBubble({ message }: MascotBubbleProps) {
  return (
    <div className="flex items-end gap-4 mb-6">
      <Image
        src="https://images.microcms-assets.io/assets/85587b49d72b496e934cea1ec7411c0d/9cd335ce985b4966aa25136da2c0446c/images_for-slack_cut.png"
        alt="Frog Mascot"
        width={60}
        height={60}
        className="mb-2"
      />
      <div className="bg-primary/10 rounded-2xl p-4 relative flex-1">
        <div className="absolute w-4 h-4 bg-primary/10 transform rotate-45 -bottom-2 left-4" />
        <p className="text-lg text-primary font-medium">{message}</p>
      </div>
    </div>
  )
}

