import Link from "next/link"
import { ThemeToggle } from "../utils/theme/ThemeToggle"
import { Button } from "@/components/ui/button"

export default function Navbar() {

  return (
    <div className="w-full h-[8vh] p-5 flex items-center justify-between border-b">
      <div className="flex gap-4">
        <Link href="/">
          <Button variant="ghost">Form Builder</Button>
        </Link>
        <Link href="/submissions">
          <Button variant="ghost">Submissions</Button>
        </Link>
      </div>
      <ThemeToggle />
    </div>
  )

}