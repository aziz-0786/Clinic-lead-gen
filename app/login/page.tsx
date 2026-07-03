"use client";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-600 mb-4">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ClinicLeads</h1>
          <p className="text-slate-500 text-sm mt-1">AI Patient Inquiry Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign in to your dashboard</CardTitle>
            <CardDescription>Enter your clinic email and password to access your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="doctor@yourclinic.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground font-medium mb-2">Demo accounts:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>demo@smiledental.com / demo1234 <span className="text-cyan-600">(Pro — Dental)</span></p>
                <p>demo@glowskin.com / demo1234 <span className="text-purple-600">(Growth — Skin)</span></p>
                <p>demo@apollonagpur.com / demo1234 <span className="text-green-600">(Starter — Multi)</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
