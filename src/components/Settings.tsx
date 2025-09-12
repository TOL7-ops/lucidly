import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, Sun, Moon } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [password2, setPassword2] = useState<string>('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [isLight, setIsLight] = useState<boolean>(false);

  useEffect(() => {
    setEmail(user?.email ?? '');
    const metaUrl = (user as any)?.user_metadata?.avatar_url as string | undefined;
    if (metaUrl) setAvatarUrl(metaUrl);
    const theme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const light = theme === 'light' || document.documentElement.classList.contains('light');
    setIsLight(!!light);
  }, [user]);

  const applyTheme = (light: boolean) => {
    if (light) {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  };

  const onThemeToggle = (checked: boolean) => {
    setIsLight(checked);
    applyTheme(checked);
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum size is 5MB.', variant: 'destructive' });
      return;
    }
    try {
      setUploading(true);
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) {
        console.warn('Avatar upload failed:', uploadError);
        toast({ title: 'Upload failed', description: 'Could not upload avatar.', variant: 'destructive' });
        return;
      }
      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        toast({ title: 'Public URL error', description: 'Could not resolve public URL.', variant: 'destructive' });
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) {
        console.warn('Update user metadata failed:', updateError);
        toast({ title: 'Update failed', description: 'Could not save avatar URL.', variant: 'destructive' });
        return;
      }
      setAvatarUrl(publicUrl);
      toast({ title: 'Avatar updated', description: 'Your profile picture has been updated.' });
    } catch (err) {
      console.error('Avatar error:', err);
      toast({ title: 'Error', description: 'Unexpected error uploading avatar.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const onSaveEmail = async () => {
    if (!email || !user) return;
    try {
      setSavingEmail(true);
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast({ title: 'Email updated', description: 'Check your inbox to confirm email change.' });
    } catch (err) {
      console.error('Email update error:', err);
      toast({ title: 'Error', description: 'Failed to update email.', variant: 'destructive' });
    } finally {
      setSavingEmail(false);
    }
  };

  const onSavePassword = async () => {
    if (!password || password !== password2) {
      toast({ title: 'Invalid password', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Weak password', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    try {
      setSavingPassword(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setPassword2('');
      toast({ title: 'Password updated', description: 'Your password has been changed.' });
    } catch (err) {
      console.error('Password update error:', err);
      toast({ title: 'Error', description: 'Failed to update password.', variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold font-jakarta">
            <span className="text-cosmic">Account</span>
            <span className="text-foreground"> Settings</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-2">Manage your profile and preferences</p>
        </div>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" />
                ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
                )}
              </Avatar>
              <div>
                <Label className="block mb-2">Upload new avatar</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
                  <Button variant="glass" disabled={uploading}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'Uploading' : 'Upload'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex gap-2">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1" />
                <Button variant="cosmic" onClick={onSaveEmail} disabled={savingEmail || !email}>
                  {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingEmail ? 'Saving' : 'Save'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="Confirm new password" />
            </div>
            <div>
              <Button variant="cosmic" onClick={onSavePassword} disabled={savingPassword || !password || !password2}>
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {savingPassword ? 'Updating' : 'Update Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">Toggle between light and dark modes</div>
            </div>
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4" />
              <Switch checked={isLight} onCheckedChange={onThemeToggle} />
              <Moon className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};