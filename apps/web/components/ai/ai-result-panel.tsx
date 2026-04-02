"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface AIResultPanelProps {
  loading: boolean;
  result: string | null;
  error: string | null;
  onApply: () => void;
  onRegenerate: () => void;
  onClose: () => void;
}

export function AIResultPanel({
  loading,
  result,
  error,
  onApply,
  onRegenerate,
  onClose,
}: AIResultPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg glass-heavy rounded-sm p-6 shadow-float animate-scale-in border border-secondary/15 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary-container/20 border border-secondary/30 flex items-center justify-center animate-pulse-glow">
              <Icon name="auto_awesome" size={16} filled className="text-secondary" />
            </div>
            <div>
              <h3 className="font-headline text-lg text-secondary">AI Assistant</h3>
              <p className="font-label text-[9px] uppercase tracking-widest text-on-surface/30">
                Powered by The Digital Tome
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm hover:bg-surface-container-high transition-colors"
            aria-label="Close AI panel"
          >
            <Icon name="close" size={18} className="text-on-surface/40" />
          </button>
        </div>

        <div className="decorative-line mb-4" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <div className="w-10 h-10 mx-auto rounded-full bg-secondary-container/10 border border-secondary/20 flex items-center justify-center animate-pulse">
                <Icon name="auto_awesome" size={20} className="text-secondary/60" />
              </div>
              <p className="font-body text-sm text-on-surface-variant animate-pulse">
                Conjuring wisdom from the arcane...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-error-container/10 rounded-sm border border-error/15 animate-fade-in">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="error" size={16} className="text-error" />
                <span className="font-label text-xs text-error uppercase">Error</span>
              </div>
              <p className="font-body text-sm text-error/80">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-3 animate-fade-in-up">
              <div className="bg-surface-container-low/50 p-4 rounded-sm border border-outline-variant/8 whitespace-pre-wrap font-body text-sm text-on-surface leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                {result}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(result || error) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={loading}>
              <Icon name="refresh" size={14} />
              Regenerate
            </Button>
            {result && (
              <Button size="sm" onClick={onApply} className="glow-gold">
                <Icon name="check" size={14} />
                Apply
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
