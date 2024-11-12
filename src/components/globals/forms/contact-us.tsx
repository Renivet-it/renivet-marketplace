"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button-general";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { Textarea } from "@/components/ui/textarea-general";
import { trpc } from "@/lib/trpc/client";
import { CreateTicket, createTicketSchema } from "@/lib/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export function ContactUsForm() {
    const form = useForm<CreateTicket>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            name: "",
            email: "",
            message: "",
            phone: "",
            company: "",
        },
    });

    const { mutate: sendMessage, isPending } =
        trpc.tickets.createTicket.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Sending message...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success("Message sent successfully", { id: toastId });
                form.reset();
            },
            onError: (error, _, ctx) => {
                return toast.error(error.message, { id: ctx?.toastId });
            },
        });

    return (
        <Form {...form}>
            <form
                className="space-y-2 md:space-y-5"
                onSubmit={form.handleSubmit((values) => sendMessage(values))}
            >
                <div className="flex flex-col items-center gap-2 md:flex-row md:gap-5">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="font-semibold">
                                    Name
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="h-12"
                                        placeholder="Brian Johnson"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="font-semibold">
                                    Email
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="h-12"
                                        type="email"
                                        placeholder="brianjohnson@gmail.com"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex flex-col items-center gap-2 md:flex-row md:gap-5">
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="font-semibold">
                                    Phone
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="h-12"
                                        placeholder="1234567890"
                                        disabled={isPending}
                                        {...field}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel className="font-semibold">
                                    Company
                                </FormLabel>

                                <FormControl>
                                    <Input
                                        className="h-12"
                                        placeholder="Company Inc."
                                        disabled={isPending}
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>

                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className="font-semibold">
                                Message
                            </FormLabel>

                            <FormControl>
                                <Textarea
                                    minRows={8}
                                    placeholder="Your message here..."
                                    disabled={isPending}
                                    {...field}
                                />
                            </FormControl>

                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    size="lg"
                    className="w-full uppercase tracking-widest"
                    disabled={isPending}
                >
                    <span>Send Message</span>
                    <Icons.ArrowRight />
                </Button>
            </form>
        </Form>
    );
}
