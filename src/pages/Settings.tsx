import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

export const Settings = () => {
  const [role, setRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setRole(data.role));
  }, []);

  const updateRole = async () => {
    const res = await fetch("/api/auth/update-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      toast({ title: "Role updated successfully." });
    } else {
      toast({ title: "Update failed.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">User Settings</h1>
      <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g., Business Analyst" />
      <Button className="mt-4" onClick={updateRole}>Update Role</Button>
    </div>
  );
};
