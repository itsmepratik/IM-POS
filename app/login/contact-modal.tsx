"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

interface ContactModalProps {
  children?: React.ReactNode;
}

export function ContactModal({ children }: ContactModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button variant="ghost">Contact</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contact Administrator</DialogTitle>
          <DialogDescription>
            This system involves authorized personnel only.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            If you need access or are experiencing issues, please contact the
            system administrator.
          </p>
          
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border p-4 bg-muted/30 flex items-center gap-4 hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email Support
                </span>
                <a
                  href="mailto:admin@hnsautomotive.com"
                  className="text-sm font-semibold hover:underline truncate"
                >
                  admin@hnsautomotive.com
                </a>
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/30 flex items-center gap-4 hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Phone Support
                </span>
                <a
                  href="tel:+968 93396309" // Replace with actual number if known, using generic placeholder as none was provided
                  className="text-sm font-semibold hover:underline truncate"
                >
                  +968 93396309
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
