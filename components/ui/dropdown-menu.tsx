"use client";

import * as React from "react";
import {
  MenuTrigger,
  Button as RACButton,
  Popover,
  Menu,
  MenuItem,
  MenuSection,
  Header,
  Separator,
  SubmenuTrigger,
  type MenuTriggerProps,
  type ButtonProps,
  type PopoverProps,
  type MenuProps,
  type MenuItemProps,
  type MenuSectionProps,
  type HeaderProps,
  type SeparatorProps,
} from "react-aria-components";
import { ChevronRight, Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface DropdownMenuContextValue {
  isLoading?: boolean;
  error?: string | null;
  onError?: (error: string) => void;
  onClearError?: () => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue>({});

const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext);
  return context;
};

interface DropdownMenuProps
  extends React.ComponentPropsWithoutRef<typeof MenuTrigger> {
  isLoading?: boolean;
  error?: string | null;
  onError?: (error: string) => void;
  onClearError?: () => void;
}

// Root component
const DropdownMenu = React.forwardRef<
  React.ElementRef<typeof MenuTrigger>,
  DropdownMenuProps
>(({ children, isLoading, error, onError, onClearError, ...props }, ref) => {
  const contextValue = React.useMemo(
    () => ({ isLoading, error, onError, onClearError }),
    [isLoading, error, onError, onClearError]
  );

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <MenuTrigger ref={ref} {...props}>
        {children}
      </MenuTrigger>
    </DropdownMenuContext.Provider>
  );
});
DropdownMenu.displayName = "DropdownMenu";

// Trigger component
const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof RACButton>,
  React.ComponentPropsWithoutRef<typeof RACButton> & {
    asChild?: boolean;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    size?: "default" | "sm" | "lg" | "icon";
  }
>(
  (
    {
      className,
      children,
      asChild,
      variant = "default",
      size = "default",
      ...props
    },
    ref
  ) => {
    const { isLoading, error } = useDropdownMenu();

    const childVariant = React.isValidElement(children)
      ? (children as any).props?.variant ?? variant
      : variant;
    const childSize = React.isValidElement(children)
      ? (children as any).props?.size ?? size
      : size;
    const childClassName = React.isValidElement(children)
      ? (children as any).props?.className
      : undefined;

    return (
      <RACButton
        ref={ref}
        className={cn(
          buttonVariants({ variant: childVariant, size: childSize }),
          error && "border-destructive text-destructive",
          childClassName,
          className
        )}
        isDisabled={isLoading}
        aria-describedby={error ? "dropdown-error" : undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </>
        ) : React.isValidElement(children) ? (
          children.props?.children ?? children
        ) : (
          children
        )}
      </RACButton>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

// Content component
const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  PopoverProps & {
    className?: string;
    sideOffset?: number;
    align?: "start" | "center" | "end";
    placement?: string; // Accept but ignore placement prop for compatibility
  }
>(({ className, sideOffset = 4, children, placement, ...props }, ref) => {
  const { error, onClearError } = useDropdownMenu();

  React.useEffect(() => {
    // Clear error when menu opens
    if (onClearError) {
      onClearError();
    }
  }, [onClearError]);

  return (
    <Popover
      ref={ref}
      offset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-xl border-2 bg-popover p-1.5 text-popover-foreground shadow-md",
        "data-[entering]:animate-in data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[entering]:fade-in-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95",
        "data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2",
        "max-sm:w-[15.5rem]",
        className
      )}
      {...props}
    >
      <Menu className="outline-none">
        {error && (
          <div
            id="dropdown-error"
            className="px-2 py-1.5 text-sm text-destructive bg-destructive/10 rounded-sm mb-1"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        {children}
      </Menu>
    </Popover>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

// Menu item component
interface DropdownMenuItemProps extends MenuItemProps {
  className?: string;
  inset?: boolean;
  isLoading?: boolean;
  onAction?: () => void | Promise<void>;
}

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, inset, children, isLoading, onAction, ...props }, ref) => {
  const { onError } = useDropdownMenu();
  const [itemLoading, setItemLoading] = React.useState(false);

  const handleAction = React.useCallback(async () => {
    if (!onAction || isLoading || itemLoading) return;

    try {
      setItemLoading(true);
      await onAction();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      if (onError) {
        onError(errorMessage);
      } else {
        console.error("Dropdown menu item error:", error);
      }
    } finally {
      setItemLoading(false);
    }
  }, [onAction, isLoading, itemLoading, onError]);

  const isDisabled = isLoading || itemLoading;

  return (
    <MenuItem
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "data-[focused]:bg-accent data-[focused]:text-accent-foreground",
        "[&>svg]:size-5 [&>svg]:stroke-[2] [&>svg]:shrink-0",
        inset && "pl-8",
        isDisabled && "opacity-50 pointer-events-none",
        className
      )}
      onAction={handleAction}
      {...props}
    >
      {itemLoading ? (
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {children}
        </div>
      ) : (
        children
      )}
    </MenuItem>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

// Checkbox item component
const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & {
    className?: string;
    checked?: boolean;
  }
>(({ className, children, checked, ...props }, ref) => (
  <MenuItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[focused]:bg-accent data-[focused]:text-accent-foreground",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4" />}
    </span>
    {children}
  </MenuItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// Radio item component
const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & {
    className?: string;
    checked?: boolean;
  }
>(({ className, children, checked, ...props }, ref) => (
  <MenuItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
      "focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[focused]:bg-accent data-[focused]:text-accent-foreground",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Circle className="h-2 w-2 fill-current" />}
    </span>
    {children}
  </MenuItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// Label component
const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  HeaderProps & {
    className?: string;
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <Header
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// Separator component
const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  SeparatorProps & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-[2px] bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// Shortcut component
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// Group component (using MenuSection)
const DropdownMenuGroup = MenuSection;

// Sub menu components
const DropdownMenuSub = MenuTrigger;

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  MenuItemProps & {
    className?: string;
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <SubmenuTrigger>
    <MenuItem
      ref={ref}
      className={cn(
        "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "focus:bg-accent data-[focused]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto" />
    </MenuItem>
  </SubmenuTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  PopoverProps & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <Popover
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border-2 bg-popover p-1 text-popover-foreground shadow-lg",
      "data-[entering]:animate-in data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[entering]:fade-in-0 data-[exiting]:zoom-out-95 data-[entering]:zoom-in-95",
      "data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  >
    <Menu className="outline-none">{props.children}</Menu>
  </Popover>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

// Portal component (React Aria handles portals automatically)
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Radio group component
const DropdownMenuRadioGroup = MenuSection;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  useDropdownMenu,
};
