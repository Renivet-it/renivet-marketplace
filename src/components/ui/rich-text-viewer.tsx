"use client";

import { Extension } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const extensions = [
    StarterKit.configure({
        orderedList: {
            HTMLAttributes: {
                class: "list-decimal",
            },
        },
        bulletList: {
            HTMLAttributes: {
                class: "list-disc",
            },
        },
        code: {
            HTMLAttributes: {
                class: "bg-accent rounded-md p-1",
            },
        },
        horizontalRule: {
            HTMLAttributes: {
                class: "my-2",
            },
        },
        codeBlock: {
            HTMLAttributes: {
                class: "bg-primary text-primary-foreground p-2 text-sm rounded-md p-1",
            },
        },
        heading: {
            levels: [1, 2, 3, 4],
            HTMLAttributes: {
                class: "tiptap-heading",
            },
        },
    }),
    Link,
    Underline,
];

export function getExtensions(
    customClasses?: RichTextViewerProps["customClasses"]
) {
    return [
        StarterKit.configure({
            bulletList: {
                HTMLAttributes: {
                    class: customClasses?.bulletList ?? "list-disc text-base",
                },
            },
            orderedList: {
                HTMLAttributes: {
                    class:
                        customClasses?.orderedList ?? "list-decimal text-base",
                },
            },
            code: {
                HTMLAttributes: {
                    class: customClasses?.code ?? "bg-accent rounded-md p-1",
                },
            },
            horizontalRule: {
                HTMLAttributes: {
                    class: customClasses?.horizontalRule ?? "my-2",
                },
            },
            codeBlock: {
                HTMLAttributes: {
                    class:
                        customClasses?.codeBlock ??
                        "bg-primary text-primary-foreground p-2 text-sm rounded-md",
                },
            },
            heading: {
                levels: [1, 2, 3, 4],
                HTMLAttributes: {
                    class: customClasses?.heading ?? "tiptap-heading",
                },
            },
        }),
        Link,
        Underline,
    ];
}

interface RichTextViewerProps {
    content: string;
    customClasses?: {
        bulletList?: string;
        orderedList?: string;
        codeBlock?: string;
        heading?: string;
        code?: string;
        horizontalRule?: string;
    };
    editorClasses?: string;
}

export function RichTextViewer({
    content,
    customClasses,
    editorClasses,
}: RichTextViewerProps) {
    const editor = useEditor({
        extensions: getExtensions(customClasses) as Extension[],
        editable: false,
        content,
    });

    return (
        <div className={editorClasses ?? ""}>
            <EditorContent editor={editor} />
        </div>
    );
}
