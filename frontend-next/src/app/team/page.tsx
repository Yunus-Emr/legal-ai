"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
  return (
    <div className="p-8 h-full flex flex-col font-sans">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage firm members and collaborate on matters.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white">Invite Member</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { name: "Atty. Yilmaz", role: "Senior Partner", status: "Online" },
          { name: "Sarah Connor", role: "Associate", status: "In Meeting" },
          { name: "John Doe", role: "Paralegal", status: "Offline" },
        ].map((member, i) => (
          <Card key={i} className="bg-surface border-border">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary font-bold border border-primary/30">
                {member.name.charAt(0)}{member.name.split(' ')[1]?.charAt(0)}
              </div>
              <h3 className="font-semibold text-foreground">{member.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{member.role}</p>
              <Button variant="outline" size="sm" className="w-full border-border bg-elevated hover:bg-primary/10 hover:text-primary"><Mail className="w-4 h-4 mr-2"/> Message</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
