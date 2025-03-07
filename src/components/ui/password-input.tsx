import { cn } from "@/lib/utils";
import * as React from "react";
import { Icons } from "../icons";
import { Button } from "./button-general";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    classNames?: {
        wrapper?: string;
        input?: string;
    };
    defaultVisible?: boolean;
    isToggleDisabled?: boolean;
};

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            disabled,
            classNames,
            defaultVisible = false,
            isToggleDisabled = false,
            ...props
        },
        ref
    ) => {
        const [isVisible, setIsVisible] = React.useState(defaultVisible);

        return (
            <div
                className={cn(
                    "flex items-center border border-input bg-background",
                    disabled && "cursor-not-allowed opacity-50",
                    classNames?.wrapper
                )}
                aria-disabled={disabled}
            >
                <input
                    type={isVisible ? "text" : "password"}
                    className={cn(
                        "flex h-10 w-full bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                        className,
                        classNames?.input
                    )}
                    disabled={disabled}
                    ref={ref}
                    {...props}
                />

                {!isToggleDisabled && (
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        tabIndex={-1}
                        onClick={() => setIsVisible((prev) => !prev)}
                    >
                        {isVisible ? (
                            <>
                                <Icons.EyeOff className="size-5" />
                                <span className="sr-only">Hide Password</span>
                            </>
                        ) : (
                            <>
                                <Icons.Eye className="size-5" />
                                <span className="sr-only">Show Password</span>
                            </>
                        )}
                    </Button>
                )}
            </div>
        );
    }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
