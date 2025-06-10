"use client";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input-general";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { forwardRef, useImperativeHandle } from "react";
import { returnOrderPhaseThree, ReturnOrderPhaseThree } from "@/lib/store/validation/return-store-validation";



export interface PaymentDetailsFormHandles {
  validate: () => Promise<boolean>;
  getValues: () => ReturnOrderPhaseThree;
}

interface PaymentDetailsFormProps {
  defaultValues?: Partial<ReturnOrderPhaseThree>;
  readOnly?: boolean;
}

const PaymentDetailsForm = forwardRef<PaymentDetailsFormHandles, PaymentDetailsFormProps>(
  ({ defaultValues, readOnly = false }, ref) => {
    const form = useForm<ReturnOrderPhaseThree>({
      resolver: zodResolver(returnOrderPhaseThree),
      defaultValues: {
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branch: "",
        ...defaultValues,
      },
    });

    // expose form methods to parent
    useImperativeHandle(ref, () => ({
      validate: form.trigger,
      getValues: form.getValues,
    }));

    return (
      <Form {...form}>
        <form className="space-y-4 max-w-xl mx-auto">
          {[
            ["accountHolderName", "Account Holder Name", "John Doe"],
            ["accountNumber", "Account Number", "1234567890"],
            ["ifscCode", "IFSC Code", "SBIN0001234"],
            ["bankName", "Bank Name", "State Bank of India"],
            ["branch", "Branch", "Kolkata Main Branch"],
          ].map(([name, label, placeholder]) => (
            <FormField
              key={name}
              control={form.control}
              name={name as keyof ReturnOrderPhaseThree}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={placeholder}
                      {...field}
                      readOnly={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </form>
      </Form>
    );
  }
);

PaymentDetailsForm.displayName = "PaymentDetailsForm";
export default PaymentDetailsForm;
