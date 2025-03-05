"use client";

import {
    UserEmailUpdateForm,
    UserGeneralUpdateForm,
    UserPhoneUpdateForm,
} from "@/components/globals/forms";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function GeneralPage({ className, ...props }: GenericProps) {
    const { data: user } = trpc.general.users.currentUser.useQuery();
    if (!user) return null;

    return (
        <div className={cn("space-y-5", className)} {...props}>
            {/* <Card className="w-full rounded-none">
                <CardHeader className="px-4 md:p-6">
                    <CardTitle>General Information</CardTitle>
                    <CardDescription>
                        Update your personal details and preferences
                    </CardDescription>
                </CardHeader>

                <UserGeneralUpdateForm user={user} />
            </Card>

            <Card className="w-full rounded-none">
                <CardContent className="space-y-6 p-4 md:p-6">
                    <UserEmailUpdateForm user={user} />
                    <UserPhoneUpdateForm user={user} />
                </CardContent>
            </Card> */}

            <Card
                className={cn(
                    "w-full rounded-none",
                    "card-box-shadow",
                    "card__body-padding"
                )}
            >
                <div
                    className={cn(
                        "card__body-heding",
                        "card__body-heding-typography"
                    )}
                >
                    Edit Details
                </div>
                <CardContent
                    className={cn(
                        "my-8",
                        "mx-16",
                        "p-3",
                        "flex",
                        "form__mobile-number-verified-box-border",
                        "flex-wrap"
                    )}
                >
                    <div className="flex-1">
                        <div>
                            <p className="form__mobile-number-verified">
                                Mobile Number*
                            </p>
                            <div>
                                <span className="align-middle">9382276557</span>
                                <span
                                    className={cn(
                                        "material-symbols-outlined",
                                        "align-middle",
                                        "text-[16px]",
                                        "relative",
                                        "form__mobile-number-verifyicon",
                                        "z-0",
                                        "text-white"
                                    )}
                                >
                                    verified
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1">
                        <button
                            className={cn(
                                "w-full border border-solid border-[#d4d5d9] px-8 py-3 text-sm font-semibold uppercase text-[#282C3F]"
                            )}
                        >
                            change
                        </button>
                    </div>
                </CardContent>
                <form className="mx-10">
                    <CardContent className="px-6">
                        <div className="relative my-6">
                            <input
                                type="text"
                                className="form__input-controls form__inputs-border peer"
                                placeholder=""
                                name="firstname"
                            />
                            <label
                                htmlFor="firstname"
                                className="form_input-controls-label capitalize"
                            >
                                First Name
                            </label>
                        </div>
                        <div className="relative my-6">
                            <input
                                type="text"
                                className="form__input-controls form__inputs-border peer"
                                placeholder=""
                                name="lastname"
                            />
                            <label
                                htmlFor="firstname"
                                className="form_input-controls-label capitalize"
                            >
                                Last Name
                            </label>
                        </div>
                        <div className="relative my-6">
                            <input
                                type="email"
                                className="form__input-controls form__inputs-border peer"
                                placeholder=""
                                name="email"
                            />
                            <label
                                htmlFor="firstname"
                                className="form_input-controls-label capitalize"
                            >
                                email
                            </label>
                        </div>
                        <div className="relative my-6 flex flex-wrap">
                            <label className="form__inputs-border relative w-full flex-1 cursor-pointer p-3 text-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="M"
                                    className="form__gender-tick-mark"
                                />
                                Male
                            </label>
                            <label className="form__inputs-border relative w-full flex-1 cursor-pointer p-3 text-center">
                                <input
                                    type="radio"
                                    name="gender"
                                    value="F"
                                    className="form__gender-tick-mark"
                                />
                                Female
                            </label>
                        </div>
                        <div className="relative my-6">
                            <input
                                type="email"
                                className="form__input-controls form__inputs-border peer"
                                placeholder=""
                                name="email"
                            />
                            <label
                                htmlFor="firstname"
                                className="form_input-controls-label"
                            >
                                Birthday (dd/mm/yyyy)
                            </label>
                        </div>
                        <div className="my-6">
                            <p className="mb-6 text-[14px] font-semibold capitalize">
                                Alternate mobile details
                            </p>
                            <div className="relative my-6">
                                <input
                                    type="text"
                                    className="form__input-controls-mobile-number form__inputs-border peer"
                                    placeholder="Mobile Number"
                                    name="mobilenumber"
                                />
                                <label
                                    htmlFor="mobilenumber"
                                    className="form__input-controls-label-fixed  capitalize"
                                >
                                +91 |
                                </label>
                            </div>
                            <div className="relative my-6">
                                <input
                                    type="text"
                                    className="form__input-controls form__inputs-border peer"
                                    placeholder="Hint Name"
                                    name="hintname"
                                    disabled
                                />
                            </div>
                            <div className="relative my-6">
                                <button type="submit" className="form__submit-button">save details</button>
                            </div>
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
