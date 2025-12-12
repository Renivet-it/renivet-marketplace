// "use client";

// import { cn } from "@/lib/utils";
// import { usePathname, useRouter } from "next/navigation";
// import { useQueryState } from "nuqs";
// import * as React from "react";
// import { useCallback, useRef, useState } from "react";
// import { Icons } from "../icons";
// import { fetchSuggestions } from "@/lib/python/ai-suggestion";

// // Custom debounce function (without useEffect)
// function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
//   let timeoutId: ReturnType<typeof setTimeout> | null = null;
//   return (...args: Parameters<T>) => {
//     if (timeoutId) {
//       clearTimeout(timeoutId);
//     }
//     timeoutId = setTimeout(() => {
//       func(...args);
//     }, delay);
//   };
// }

// export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
//   classNames?: {
//     wrapper?: string;
//     input?: string;
//   };
// };

// const ProductSearch = React.forwardRef<HTMLInputElement, InputProps>(
//   (
//     { className, disabled, type = "text", classNames, ...props },
//     ref
//   ) => {
//     const router = useRouter();
//     const pathname = usePathname();
//     const [search, setSearch] = useQueryState("search", {
//       defaultValue: "",
//     });
//     const [localSearch, setLocalSearch] = useState(search); // Initialize with search
//     const [suggestions, setSuggestions] = useState<string[]>([]);
//     const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
//     const wrapperRef = useRef<HTMLDivElement>(null);

//     // Fetch AI-driven suggestions
//     const updateSuggestions = useCallback(async (value: string) => {
//       if (value.length > 0) {
//         try {
//           console.log("Fetching suggestions for:", value);
//           const fetchedSuggestions = await fetchSuggestions(value);
//           setSuggestions(fetchedSuggestions);
//           setIsSuggestionVisible(true);
//         } catch (error) {
//           console.error("Failed to update suggestions:", error);
//           setSuggestions([]);
//           setIsSuggestionVisible(false);
//         }
//       } else {
//         setSuggestions([]);
//         setIsSuggestionVisible(false);
//       }
//     }, []);

//     // Debounced suggestion fetching
//     const debouncedUpdateSuggestions = useCallback(
//       debounce((value: string) => {
//         updateSuggestions(value);
//       }, 500),
//       [updateSuggestions]
//     );

//     // Handle input change to update localSearch and trigger debounced suggestions
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//       const value = e.target.value;
//       setLocalSearch(value);
//       debouncedUpdateSuggestions(value);
//     };

//     // Handle search submission (on Enter or suggestion click)
//     const handleSearch = (value: string) => {
//       setIsSuggestionVisible(false);
//       if (value.length > 2) {
//         if (pathname !== "/shop") {
//           router.push(`/shop?search=${encodeURIComponent(value)}`);
//         } else {
//           setSearch(value);
//         }
//       } else if (value.length === 0) {
//         if (pathname !== "/shop") {
//           router.push("/shop");
//         } else {
//           setSearch("");
//         }
//       }
//     };

//     // Handle suggestion click
//     const handleSuggestionClick = (suggestion: string) => {
//       setLocalSearch(suggestion);
//       setIsSuggestionVisible(false);
//       handleSearch(suggestion);
//     };

//     // Handle Enter or Escape key
//     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//       if (e.key === "Enter") {
//         handleSearch(localSearch);
//         setIsSuggestionVisible(false);
//       } else if (e.key === "Escape") {
//         setIsSuggestionVisible(false);
//       }
//     };

//     // Handle clear button click
//     const handleClear = () => {
//       setLocalSearch("");
//       setSuggestions([]);
//       setIsSuggestionVisible(false);

//       if (pathname === "/") {
//         setLocalSearch("");
//       } else if (pathname.startsWith("/shop")) {
//         setSearch("");
//       } else {
//         setLocalSearch("");
//       }
//     };

//     // Handle click outside to hide suggestions
//     const handleClickOutside = useCallback((e: MouseEvent) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(e.target as Node)
//       ) {
//         setIsSuggestionVisible(false);
//       }
//     }, []);

//     // Add click outside listener on mount, remove on unmount
//     // Note: This still requires a way to handle lifecycle without useEffect.
//     // We'll simulate it with a ref-based approach or manual cleanup.
//     const isMounted = useRef(false);
//     if (!isMounted.current) {
//       isMounted.current = true;
//       document.addEventListener("click", handleClickOutside);
//     }

//     // Simulate cleanup (this is a workaround since we're avoiding useEffect)
//     // In a real-world scenario, you might need a cleanup mechanism tied to component unmounting.
//     // This can be handled by wrapping in a higher-order component or using a library.
//     const cleanup = () => {
//       document.removeEventListener("click", handleClickOutside);
//     };

//     // Handle initial sync of localSearch with search (instead of useEffect)
//     // This runs only once when the component mounts.
//     const initialSync = useRef(false);
//     if (!initialSync.current) {
//       initialSync.current = true;
//       setLocalSearch(search);
//     }

//     return (
//       <div
//         ref={wrapperRef}
//         className={cn(
//            "relative flex w-full items-center gap-1 rounded-full bg-white shadow-md",
//           disabled && "cursor-not-allowed opacity-50",
//           classNames?.wrapper
//         )}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="p-2 pl-3">
//           <Icons.Search className="size-5 opacity-60" />
//         </div>

//         <input
//           type="text"
//           className={cn(
//     "flex h-9 w-full bg-transparent pr-10 text-sm text-gray-700 placeholder-gray-500 focus:outline-none",
//             className,
//             classNames?.input
//           )}
//           disabled={disabled}
//           ref={ref}
//           value={localSearch}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           onFocus={() => debouncedUpdateSuggestions(localSearch)}
//           placeholder="Search for products..."
//           {...props}
//         />

//         {/* Clear Button (Cross) */}
//         {localSearch && (
//           <button
//             type="button"
//             className="absolute right-2 p-1"
//             onClick={handleClear}
//             aria-label="Clear search"
//           >
//             <Icons.X className="size-5 opacity-60 hover:opacity-100" />
//           </button>
//         )}

//         {/* Suggestions Dropdown */}
//         {isSuggestionVisible && suggestions.length > 0 && (
//           <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-foreground/20 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
//             {suggestions.map((suggestion, index) => (
//               <li
//                 key={index}
//                 className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
//                 onClick={() => handleSuggestionClick(suggestion)}
//               >
//                 {suggestion}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     );
//   }
// );

// // Manual cleanup on component unmount (workaround)
// ProductSearch.displayName = "ProductSearch";
// export { ProductSearch };
"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Icons } from "../icons";
import { fetchSuggestions } from "@/lib/python/ai-suggestion";

// Debounce utility (unchanged)
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  classNames?: {
    wrapper?: string;
    input?: string;
  };
};

const ProductSearch = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, type = "text", classNames, ...props }, ref) => {
    const router = useRouter();
    const pathname = usePathname();
    const [search, setSearch] = useQueryState("search", { defaultValue: "" });
    const [localSearch, setLocalSearch] = useState(search);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // --- Suggestion fetching logic ---
    const updateSuggestions = useCallback(async (value: string) => {
      if (value.length > 0) {
        try {
          const fetchedSuggestions = await fetchSuggestions(value);
          setSuggestions(fetchedSuggestions);
          setIsSuggestionVisible(true);
        } catch (error) {
          console.error("Failed to update suggestions:", error);
          setSuggestions([]);
          setIsSuggestionVisible(false);
        }
      } else {
        setSuggestions([]);
        setIsSuggestionVisible(false);
      }
    }, []);

    const debouncedUpdateSuggestions = useCallback(
      debounce((value: string) => updateSuggestions(value), 500),
      [updateSuggestions]
    );

    // --- Input & search handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);
      debouncedUpdateSuggestions(value);
    };

    const handleSearch = (value: string) => {
      setIsSuggestionVisible(false);
      if (value.length > 2) {
        if (pathname !== "/shop") router.push(`/shop?search=${encodeURIComponent(value)}`);
        else setSearch(value);
      } else if (value.length === 0) {
        if (pathname !== "/shop") router.push("/shop");
        else setSearch("");
      }
    };

    const handleSuggestionClick = (suggestion: string) => {
      setLocalSearch(suggestion);
      setIsSuggestionVisible(false);
      handleSearch(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch(localSearch);
      else if (e.key === "Escape") setIsSuggestionVisible(false);
    };

    const handleClear = () => {
      setLocalSearch("");
      setSuggestions([]);
      setIsSuggestionVisible(false);
      if (pathname.startsWith("/shop")) setSearch("");
    };

    // --- Click outside handler (safe for SSR) ---
    const handleClickOutside = useCallback((e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsSuggestionVisible(false);
      }
    }, []);

    // ✅ Properly attach/detach DOM listeners (client-side only)
    React.useEffect(() => {
      if (typeof document === "undefined") return; // SSR guard
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, [handleClickOutside]);

    // ✅ Sync initial state on mount
    React.useEffect(() => {
      setLocalSearch(search);
    }, [search]);

    return (
      <div
        ref={wrapperRef}
        className={cn(
          "relative flex w-full items-center bg-[#fbfaf4] gap-1 rounded-none shadow-md",
          disabled && "cursor-not-allowed opacity-50",
          classNames?.wrapper
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 pl-3 bg-[#fbfaf4]">
          <Icons.Search className="bg-[#fbfaf4] size-5 opacity" />
        </div>

        <input
          type="text"
          className={cn(
            "flex h-9 w-full pr-10 text-sm bg-[#fbfaf4] text-gray-700 placeholder-gray-500 focus:outline-none",
            className,
            classNames?.input
          )}
          disabled={disabled}
          ref={ref}
          value={localSearch}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => debouncedUpdateSuggestions(localSearch)}
          placeholder="Search for products..."
          {...props}
        />

        {localSearch && (
          <button
            type="button"
            className="absolute right-2 p-1"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <Icons.X className="size-5 opacity-60 hover:opacity-100" />
          </button>
        )}

{isSuggestionVisible && suggestions.length > 0 && (
  <ul className="absolute top-full left-0 mt-1 w-full bg-white border border-foreground/20 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto text-left">
    {suggestions.map((suggestion, index) => (
      <li
        key={index}
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-left"
        onClick={() => handleSuggestionClick(suggestion)}
      >
        {suggestion}
      </li>
    ))}
  </ul>
)}

      </div>
    );
  }
);

ProductSearch.displayName = "ProductSearch";
export { ProductSearch };
