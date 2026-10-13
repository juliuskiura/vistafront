"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "@/lib/icons";
import { SocialIconSolid } from "@/components/social-icons";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import type { ManagedChannel, PostRecipient } from "@/lib/api/types";

interface PlatformPostSheetProps {
  post: PostRecipient;
  pageById: Record<string, ManagedChannel>;
  workspace: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platformPostUrl?: string;
}

/**
 * Sheet that displays the actual platform post with its content
 * and comment thread, allowing users to see what the post looks like
 * on the social media platform.
 */
export function PlatformPostSheet({
  post,
  pageById,
  workspace,
  open,
  onOpenChange,
  platformPostUrl,
}: PlatformPostSheetProps & { onOpenChange: (open: boolean) => void }) {
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const page = pageById[post.managed_page];
  const platformName = page?.platform_name || post.managed_page_name;
  const { brandOf } = usePlatformBrand();
  
  const handleSubmit = async () => {
    if (!commentText.trim()) {
      setError("Comment text is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // TODO: Implement actual comment posting logic
      // This would call the appropriate API to post a comment on the platform
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just close the sheet
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="relative shrink-0">
              <ChannelAvatar
                nanoid={page?.nanoid ?? post.managed_page}
                pictureUrl={page?.profile_picture_url ?? ""}
                workspace={workspace}
                className="size-8 rounded-full object-cover ring-1 ring-black/5"
                fallback={
                  <span className="flex size-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 ring-1 ring-black/5">
                    {post.managed_page_name.slice(0, 1).toUpperCase()}
                  </span>
                }
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white ring-1 ring-black/5">
                {page?.platform ? (
                  <SocialIconSolid name={brandOf(page.platform)} className="size-5" />
                ) : null}
              </span>
            </span>
            <div>
              <div className="font-semibold">{platformName}</div>
              <div className="text-xs text-neutral-500">Platform Post</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            This is how the post appears on the platform with the current comment thread.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Platform Post Content */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-6 rounded-full bg-neutral-200 flex items-center justify-center">
                {page?.platform ? (
                  <SocialIconSolid name={brandOf(page.platform)} className="size-4" />
                ) : null}
              </div>
              <div className="font-medium text-sm">{page?.account_name || post.managed_page_name}</div>
              <div className="text-xs text-neutral-500">· Posted</div>
            </div>
            
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
            
            {post.media_image_urls && post.media_image_urls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {post.media_image_urls.map((url, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-neutral-200">
                    <img 
                      src={url} 
                      alt="" 
                      className="size-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Comment Thread */}
          <div className="space-y-3">
            <div className="font-medium text-sm">Comments</div>
            
            {/* TODO: Replace with actual comment thread component */}
            <div className="text-xs text-neutral-500 italic">
              Comment thread integration pending...
            </div>
            
            {/* Add comment input */}
            <div className="mt-4 space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                disabled={isSubmitting}
              />
              
              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || isSubmitting}
                  size="sm"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
