"use client";

import { BlockquoteToolbar } from "@/components/toolbars/blockquote";
import { BoldToolbar } from "@/components/toolbars/bold";
import { BulletListToolbar } from "@/components/toolbars/bullet-list";
import { CodeToolbar } from "@/components/toolbars/code";
import { CodeBlockToolbar } from "@/components/toolbars/code-block";
import { HardBreakToolbar } from "@/components/toolbars/hard-break";
import { HorizontalRuleToolbar } from "@/components/toolbars/horizontal-rule";
import { ItalicToolbar } from "@/components/toolbars/italic";
import { LinkToolbar } from "@/components/toolbars/link";
import { OrderedListToolbar } from "@/components/toolbars/ordered-list";
import { RedoToolbar } from "@/components/toolbars/redo";
import { StrikeThroughToolbar } from "@/components/toolbars/strikethrough";
import { ToolbarProvider } from "@/components/toolbars/toolbar-provider";
import { UnderlineToolbar } from "@/components/toolbars/underline";
import { UndoToolbar } from "@/components/toolbars/undo";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { forwardRef, useEffect, useImperativeHandle } from "react";

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

interface EditorProps {
    content: string;
    onChange: (content: string) => void;
    disabled?: boolean;
}

export interface EditorRef {
    setContent: (content: string) => void;
}

const Editor = forwardRef<EditorRef, EditorProps>((props, ref) => {
    const editor = useEditor({
        extensions: extensions as Extension[],
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            props.onChange(editor.getHTML());
        },
        editable: !props.disabled,
    });

    useImperativeHandle(ref, () => ({
        setContent: (newContent: string) =>
            editor?.commands.setContent(newContent),
    }));

    useEffect(() => {
        if (editor && props.content !== editor.getHTML())
            editor.commands.setContent(props.content);
    }, [editor, props.content]);

    return (
        <div
            className={cn(
                "relative w-full overflow-hidden rounded-md border border-input pb-3",
                props.disabled && "cursor-not-allowed opacity-50"
            )}
        >
            <div className="sticky left-0 top-0 z-20 flex w-full items-center justify-between border-b border-input bg-background p-2">
                <ToolbarProvider editor={editor}>
                    <div className="flex flex-wrap items-center gap-2">
                        <UndoToolbar disabled={props.disabled} />
                        <RedoToolbar />
                        <Separator orientation="vertical" className="h-7" />
                        <BoldToolbar disabled={props.disabled} />
                        <ItalicToolbar disabled={props.disabled} />
                        <LinkToolbar disabled={props.disabled} />
                        <UnderlineToolbar disabled={props.disabled} />
                        <StrikeThroughToolbar disabled={props.disabled} />
                        <BulletListToolbar disabled={props.disabled} />
                        <OrderedListToolbar disabled={props.disabled} />
                        <CodeToolbar disabled={props.disabled} />
                        <CodeBlockToolbar disabled={props.disabled} />
                        <HorizontalRuleToolbar disabled={props.disabled} />
                        <BlockquoteToolbar disabled={props.disabled} />
                        <HardBreakToolbar disabled={props.disabled} />
                    </div>
                </ToolbarProvider>
            </div>

            <div
                onClick={() => {
                    if (props.disabled) return;
                    editor?.chain().focus().run();
                }}
                className={cn(
                    "min-h-72 cursor-text bg-background text-sm",
                    props.disabled && "cursor-not-allowed"
                )}
            >
                <EditorContent
                    className="px-4 pt-2 disabled:cursor-not-allowed"
                    editor={editor}
                />
            </div>
        </div>
    );
});

Editor.displayName = "Editor";

export { Editor };
