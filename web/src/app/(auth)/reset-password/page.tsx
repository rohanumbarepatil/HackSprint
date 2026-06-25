'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Connect to AuthService reset function
    setTimeout(() => {
      setIsSent(true);
      setIsLoading(false);
      toast.success('Password reset link sent to your email.');
    }, 1000);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we will send you a verification code
        </p>
      </div>

      {!isSent ? (
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required disabled={isLoading} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      ) : (
        <div className="space-y-4 text-center sm:text-left">
          <p className="text-sm">Check your email for the reset link.</p>
          <Button variant="outline" className="w-full" onClick={() => setIsSent(false)}>
            Try another email
          </Button>
        </div>
      )}

      <p className="px-8 text-center text-sm text-muted-foreground mt-4">
        Remember your password?{' '}
        <Link href="/login" className="hover:text-primary underline underline-offset-4 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
