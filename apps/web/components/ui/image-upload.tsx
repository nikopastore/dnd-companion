"use client";

import { useState, useRef, type DragEvent } from "react";
import { Icon } from "./icon";

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (url: string, base64: string) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

export function ImageUpload({
  currentImage,
  onUpload,
  size = "md",
  label = "Upload Image",
  className = "",
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  }[size];

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const { url } = await res.json();

      // Also get base64 for AI vision
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        onUpload(url, base64);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          ${sizeClasses} rounded-sm overflow-hidden cursor-pointer
          border-2 border-dashed transition-all duration-300
          flex items-center justify-center relative group
          ${dragging
            ? "border-secondary/60 bg-secondary-container/10 glow-gold"
            : currentImage
              ? "border-transparent hover:border-secondary/30"
              : "border-outline-variant/20 hover:border-secondary/30 bg-surface-container-highest/50 hover:bg-surface-container-high/50"
          }
        `}
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icon name="edit" size={20} className="text-secondary" />
            </div>
          </>
        ) : uploading ? (
          <div className="animate-pulse">
            <Icon name="cloud_upload" size={24} className="text-secondary/40" />
          </div>
        ) : (
          <div className="text-center p-2">
            <Icon name="add_photo_alternate" size={size === "sm" ? 18 : 24} className="text-on-surface/20 group-hover:text-secondary/60 transition-colors mx-auto" />
            {size !== "sm" && (
              <p className="font-label text-[9px] uppercase tracking-widest text-on-surface/20 mt-1 group-hover:text-on-surface/40 transition-colors">
                {label}
              </p>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && (
        <p className="text-error text-[10px] font-body mt-1 animate-fade-in">{error}</p>
      )}
    </div>
  );
}
