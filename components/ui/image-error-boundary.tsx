/**
 * Image Error Boundary Component
 *
 * Provides fallback UI when images fail to load, with retry functionality
 * and proper error handling.
 */

"use client";

import React from "react";
import { ImageIcon, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ImageErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  onRetry?: () => void;
  className?: string;
  showRetryButton?: boolean;
  maxRetries?: number;
}

interface ImageErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class ImageErrorBoundary extends React.Component<
  ImageErrorBoundaryProps,
  ImageErrorBoundaryState
> {
  private maxRetries: number;

  constructor(props: ImageErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries || 3;
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<ImageErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Image loading error:", error, errorInfo);
    this.props.onError?.(error);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
      }));
      this.props.onRetry?.();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={cn(
            "flex flex-col items-center justify-center bg-muted rounded-md p-4 text-muted-foreground",
            this.props.className
          )}
        >
          {this.state.retryCount < this.maxRetries ? (
            <>
              <AlertTriangle className="h-8 w-8 mb-2 text-orange-500" />
              <p className="text-sm text-center mb-3">
                Failed to load image
                {this.state.error && (
                  <span className="block text-xs mt-1 opacity-75">
                    {this.state.error.message}
                  </span>
                )}
              </p>
              {this.props.showRetryButton !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry ({this.maxRetries - this.state.retryCount} left)
                </Button>
              )}
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 mb-2" />
              <p className="text-sm text-center">Image unavailable</p>
            </>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional component version for easier usage with hooks
 */
interface ImageErrorFallbackProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
  className?: string;
}

export function ImageErrorFallback({
  children,
  fallback,
  onError,
  className,
}: ImageErrorFallbackProps) {
  return (
    <ImageErrorBoundary
      fallback={fallback}
      onError={onError}
      className={className}
      showRetryButton={false}
    >
      {children}
    </ImageErrorBoundary>
  );
}
