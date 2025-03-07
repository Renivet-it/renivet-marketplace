"use client";

import { Icons } from "@/components/icons";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog-dash";
import { Button } from "@/components/ui/button-dash";
import {
    Notice,
    NoticeButton,
    NoticeContent,
    NoticeTitle,
} from "@/components/ui/notice-dash";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Spinner } from "@/components/ui/spinner";
import {
    createRazorpaySubscriptionOptions,
    initializeRazorpaySubscription,
} from "@/lib/razorpay/subscription";
import { trpc } from "@/lib/trpc/client";
import {
    cn,
    convertPaiseToRupees,
    convertPlanPeriodToHumanReadable,
    formatPriceTag,
    handleClientError,
} from "@/lib/utils";
import { CachedBrand, Plan } from "@/lib/validations";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface PageProps extends GenericProps {
    plans: Plan[];
    brand: CachedBrand;
}

export function PlansGrid({ className, plans, brand, ...props }: PageProps) {
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    const activePlan = useMemo(
        () => brand.subscriptions.find((sub) => sub.isActive),
        [brand.subscriptions]
    );

    const isActivePlanAvailable = useMemo(
        () => plans.find((plan) => plan.id === activePlan?.planId),
        [plans, activePlan]
    );

    const { mutate: cancelSub, isPending: isCancelling } =
        trpc.brands.brands.subscriptions.cancelBrandSubscription.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Cancelling subscription...");
                return { toastId };
            },
            onSuccess: (_, __, { toastId }) => {
                toast.success(
                    "Your subscription has been cancelled, reloading...",
                    { id: toastId }
                );
                window.location.reload();
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            {!!activePlan && (
                <Notice>
                    <NoticeContent>
                        <NoticeTitle>
                            <Icons.CircleCheck className="size-4" />
                            Active Plan
                        </NoticeTitle>

                        <p className="text-sm">
                            You are currently subscribed to the{" "}
                            <strong>{activePlan?.plan.name}</strong> plan. You
                            can cancel your subscription or change your plan at
                            any time.
                        </p>

                        {!isActivePlanAvailable && (
                            <p className="text-error text-sm">
                                Your active plan is no longer available. Please
                                choose a new plan to continue using the
                                features.
                            </p>
                        )}
                    </NoticeContent>
                    <NoticeButton asChild>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => setIsCancelModalOpen(true)}
                        >
                            Cancel Subscription
                        </Button>
                    </NoticeButton>
                </Notice>
            )}

            <section
                className={cn(
                    "space-y-6 rounded-md border border-foreground/20 bg-muted p-5",
                    className
                )}
                {...props}
            >
                <div className="space-y-1 text-center">
                    <h2 className="text-xl font-semibold">Available Plans</h2>
                    <p className="text-balance text-sm text-muted-foreground">
                        Choose a plan that best fits your needs. You can always
                        change your plan later.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <PlanCard key={plan.id} plan={plan} brand={brand} />
                    ))}
                </div>
            </section>

            <AlertDialog
                open={isCancelModalOpen}
                onOpenChange={setIsCancelModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to cancel your subscription?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            By cancelling your subscription, you will lose
                            access to all the features. You can always subscribe
                            again later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() => setIsCancelModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isCancelling}
                            onClick={() => {
                                if (!activePlan)
                                    return toast.error("No active plan found");
                                cancelSub({
                                    id: activePlan.id,
                                });
                            }}
                        >
                            Cancel Subscription
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function PlanCard({ plan, brand }: { plan: Plan; brand: CachedBrand }) {
    const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
    const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
    const [processingModalTitle, setProcessingModalTitle] = useState("");
    const [processingModalDescription, setProcessingModalDescription] =
        useState("");
    const [processingModalState, setProcessingModalState] = useState<
        "pending" | "success" | "error"
    >("pending");

    const existingSubscription = useMemo(
        () =>
            brand.subscriptions.find(
                (sub) => sub.planId === plan.id && sub.isActive
            ),
        [brand.subscriptions, plan.id]
    );

    const activeSub = useMemo(
        () => brand.subscriptions.find((sub) => sub.isActive),
        [brand.subscriptions]
    );

    const { mutate: createSub, isPending: isCreating } =
        trpc.brands.brands.subscriptions.createBrandSubscription.useMutation({
            onMutate: () => {
                const toastId = toast.loading("Subscribing to plan...");
                return { toastId };
            },
            onSuccess: (data, __, { toastId }) => {
                toast.success("Opening payment gateway...", {
                    id: toastId,
                });
                setIsSubscribeModalOpen(false);

                const options = createRazorpaySubscriptionOptions({
                    brand,
                    subcriptionId: data.id,
                    setIsProcessingModalOpen,
                    setProcessingModalTitle,
                    setProcessingModalDescription,
                    setProcessingModalState,
                });

                initializeRazorpaySubscription(options);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    const { mutate: changeSub, isPending: isChanging } =
        trpc.brands.brands.subscriptions.changeBrandSubscription.useMutation({
            onMutate: () => {
                const toastId = toast.loading(
                    `Changing subscription to ${plan.name}...`
                );
                return { toastId };
            },
            onSuccess: (data, __, { toastId }) => {
                toast.success("Opening payment gateway...", {
                    id: toastId,
                });
                setIsSubscribeModalOpen(false);

                const options = createRazorpaySubscriptionOptions({
                    brand,
                    subcriptionId: data.id,
                    setIsProcessingModalOpen,
                    setProcessingModalTitle,
                    setProcessingModalDescription,
                    setProcessingModalState,
                });

                initializeRazorpaySubscription(options);
            },
            onError: (err, _, ctx) => {
                return handleClientError(err, ctx?.toastId);
            },
        });

    return (
        <>
            <div className="flex flex-col space-y-3 rounded-md border border-foreground/20 bg-background p-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{plan.name}</h3>

                    <p className="space-x-1">
                        <span className="text-2xl">
                            <strong>
                                {formatPriceTag(
                                    +convertPaiseToRupees(plan.amount)
                                )}
                            </strong>
                        </span>
                        <span>/</span>
                        <span>
                            {convertPlanPeriodToHumanReadable(plan.period)}
                        </span>
                    </p>
                </div>

                <Button
                    size="sm"
                    className="w-full"
                    disabled={!!existingSubscription}
                    onClick={() => setIsSubscribeModalOpen(true)}
                >
                    {existingSubscription
                        ? "Current Plan"
                        : activeSub
                          ? plan.amount > activeSub.plan.amount
                              ? "Upgrade"
                              : "Downgrade"
                          : "Subscribe"}
                </Button>

                <RichTextViewer
                    content={plan?.description || "<p>No content yet</p>"}
                />
            </div>

            <AlertDialog
                open={isSubscribeModalOpen}
                onOpenChange={setIsSubscribeModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure you want to subscribe to this plan?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            By subscribing to this plan, you will be charged{" "}
                            <strong>
                                {formatPriceTag(
                                    +convertPaiseToRupees(plan.amount)
                                )}{" "}
                                every{" "}
                                {convertPlanPeriodToHumanReadable(plan.period)}
                            </strong>
                            . You can always change/cancel your plan at any
                            time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={isCreating || isChanging}
                            onClick={() => setIsSubscribeModalOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            size="sm"
                            disabled={isCreating || isChanging}
                            onClick={() => {
                                if (activeSub) {
                                    if (!activeSub.id)
                                        return toast.error(
                                            "No active subscription found"
                                        );
                                    changeSub({
                                        activeSubscriptionId: activeSub.id,
                                        newSubscription: {
                                            brandId: brand.id,
                                            planId: plan.id,
                                            totalCount: 360,
                                            customerNotify: true,
                                            expireBy: null,
                                            quantity: 1,
                                            startAt: new Date(),
                                        },
                                    });
                                } else {
                                    createSub({
                                        brandId: brand.id,
                                        planId: plan.id,
                                        totalCount: 360,
                                        customerNotify: true,
                                        expireBy: null,
                                        quantity: 1,
                                        startAt: new Date(),
                                    });
                                }
                            }}
                        >
                            {existingSubscription
                                ? "Change Plan"
                                : activeSub
                                  ? plan.amount > activeSub.plan.amount
                                      ? "Upgrade Plan"
                                      : "Downgrade Plan"
                                  : "Subscribe"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={isProcessingModalOpen}
                onOpenChange={setIsProcessingModalOpen}
            >
                <AlertDialogContent>
                    <AlertDialogTitle className="sr-only">
                        <AlertDialogHeader>
                            {processingModalTitle}
                        </AlertDialogHeader>
                    </AlertDialogTitle>

                    <div className="flex flex-col items-center gap-5 py-10">
                        <div>
                            {processingModalState === "pending" && (
                                <Spinner className="size-12" />
                            )}
                            {processingModalState === "success" && (
                                <Icons.CircleCheck className="size-12" />
                            )}
                            {processingModalState === "error" && (
                                <Icons.AlertTriangle className="size-12" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-center text-xl font-semibold">
                                {processingModalTitle}
                            </h3>
                            <p className="text-balance text-center text-sm">
                                {processingModalDescription}
                            </p>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
