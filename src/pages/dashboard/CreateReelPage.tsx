
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Copy, Loader2, RefreshCw } from 'lucide-react';

const generateReelId = () => {
  return Math.random().toString(36).substring(2, 8);
};

interface Submission {
  id: number;
  name: string;
  username: string;
}

export default function CreateReelPage() {
  const [loading, setLoading] = useState(true);
  const [newReelId, setNewReelId] = useState(generateReelId());
  const [redirectUrl, setRedirectUrl] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedLink, setLastCreatedLink] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: reelsData, error: reelsError } = await supabase
        .from('reels')
        .select('reelId')
        .eq('userId', user.id);

      if (reelsError) throw reelsError;

      const reelIds = reelsData.map((reel) => reel.reelId);

      if (reelIds.length === 0) {
        setSubmissions([]);
        return;
      }

      const { data, error } = await supabase
        .from('submissions')
        .select('id, name, username')
        .in('reelId', reelIds);

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast.error(error.message || 'Failed to fetch submissions.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLastCreatedLink(null);

    if (!user) {
      toast.error('You must be logged in to create a ReelID.');
      setIsSubmitting(false);
      return;
    }

    if (!redirectUrl) {
      toast.error('Please provide a redirect URL.');
      setIsSubmitting(false);
      return;
    }

    try {
      const reelIdToSubmit = newReelId;
      const { error } = await supabase.from('reels').insert([
        {
          reelId: reelIdToSubmit,
          redirectUrl: redirectUrl,
          userId: user.id,
        },
      ]);

      if (error) throw error;

      toast.success('ReelID created successfully!');
      const link = `${window.location.origin.replace('5173', '3000')}/${reelIdToSubmit}`;
      setLastCreatedLink(link);
      setRedirectUrl('');
      setNewReelId(generateReelId());
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ReelID.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div className="space-y-10">
        <Card className="bg-gradient-to-br from-card to-secondary   shadow-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-extrabold text-primary text-center">Create New Link</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="newReelId" className="text-lg font-semibold text-muted-foreground">New ReelID</Label>
                <div className="flex items-center gap-3">
                  <Input id="newReelId" type="text" value={newReelId} readOnly className="font-mono text-lg bg-input   text-foreground" />
                  <Button type="button" variant="outline" size="icon" onClick={() => setNewReelId(generateReelId())}>
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="redirectUrl" className="text-lg font-semibold text-muted-foreground">Redirect Link</Label>
                <Input
                  id="redirectUrl"
                  type="url"
                  placeholder="https://example.com/redirect-here"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  required
                  className="text-lg bg-input   text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Submitting...</> : 'Submit'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {lastCreatedLink && (
          <Card className="bg-gradient-to-br from-card to-secondary shadow-2xl rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary text-center">Link Created!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-md text-muted-foreground mb-4 text-center">Share this link:</p>
              <div className="flex items-center gap-3">
                <Input type="text" value={lastCreatedLink} readOnly className="font-mono text-lg bg-input   text-foreground" />
                <Button
                  variant="outline"
                  size="icon"
                  className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    navigator.clipboard.writeText(lastCreatedLink);
                    toast.success('Link copied to clipboard!');
                  }}
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-gradient-to-br from-card to-secondary shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold text-primary text-center">Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
              {submissions.map((submission, index) => (
                <div key={submission.id} className="flex items-center gap-4 p-4 bg-input rounded-xl border   shadow-md">
                  <span className="text-lg font-bold text-primary">{index + 1}</span>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input type="text" value={submission.name} readOnly className="bg-background   text-foreground font-mono text-md" />
                    <Input type="text" value={submission.username} readOnly className="bg-background   text-foreground font-mono text-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-20 text-lg">No submissions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
