import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";

export default function DeliveryAgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
            <Logo />
            <div className="flex items-center gap-4">
                <p className="text-sm font-medium">Dash Delivero</p>
                <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="Dash Delivero" />
                    <AvatarFallback>DD</AvatarFallback>
                </Avatar>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
            {children}
        </main>
    </div>
  );
}
