'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export function ImageUpload({ value = [], onChange, maxFiles = 5, maxSize = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Check total number of files
    if (value.length + files.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} images allowed`,
        variant: 'destructive',
      });
      return;
    }

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image`,
          variant: 'destructive',
        });
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds ${maxSize}MB limit`,
          variant: 'destructive',
        });
        return;
      }
    }

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange([...value, ...data.urls]);

      toast({
        title: 'Success',
        description: data.message,
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (url: string) => {
    try {
      // Optionally delete from server
      await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });

      onChange(value.filter((v) => v !== url));

      toast({
        title: 'Image removed',
        description: 'Image has been removed successfully',
      });
    } catch (error) {
      // If deletion fails, still remove from state
      onChange(value.filter((v) => v !== url));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((url, index) => (
          <Card key={url} className="group relative aspect-square overflow-hidden">
            <img src={url} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={() => removeImage(url)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {index === 0 && (
              <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                Main
              </div>
            )}
          </Card>
        ))}

        {value.length < maxFiles && (
          <Card
            className="flex aspect-square cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-colors hover:border-primary hover:bg-accent"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload Image</p>
              </>
            )}
          </Card>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-xs text-muted-foreground">
        <p>• Maximum {maxFiles} images</p>
        <p>• Max file size: {maxSize}MB</p>
        <p>• Supported formats: JPG, PNG, WebP, GIF</p>
        <p>• First image will be used as the main product image</p>
      </div>
    </div>
  );
}
