import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

export function Loading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      <span>{label ?? "\u52a0\u8f7d\u4e2d..."}</span>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex-1">
          <p>
            {message ??
              "\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u540e\u7aef\u670d\u52a1\u662f\u5426\u5df2\u542f\u52a8\u3002"}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-medium hover:bg-red-100"
            >
              <RefreshCw className="h-3 w-3" />
              {"\u91cd\u8bd5"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text?: string }) {
  return (
    <div className="py-8 text-center text-sm text-slate-500">
      {text ?? "\u6682\u65e0\u6570\u636e"}
    </div>
  );
}
