import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 md:p-6">
        <Image
          src="/placeholder.svg"
          alt="Square Logo"
          width={32}
          height={32}
          className="dark:invert"
        />
        <Link href="#" className="text-blue-600 hover:underline">
          Learn more
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              New to Square?{" "}
              <Link href="#" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Email or phone number"
              className="w-full"
            />
            <Button className="w-full" size="lg">
              Continue
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" size="lg">
            Sign in with a passkey
          </Button>
        </div>
      </main>

      <footer className="p-4 md:p-6">
        <Button variant="link" className="text-muted-foreground">
          English
        </Button>
      </footer>
    </div>
  )
}

