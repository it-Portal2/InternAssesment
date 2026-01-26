import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { InsertApplicationForm } from "@/lib/validation";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useEffect } from "react";

interface StepPersonalInfoProps {
  form: UseFormReturn<InsertApplicationForm>;
}

export default function StepPersonalInfo({ form }: StepPersonalInfoProps) {
  const { updateStep1Data } = useApplicationStore();
  const watchedValues = form.watch();

  useEffect(() => {
    const { fullName, email, phone, linkedin } = watchedValues;
    updateStep1Data({
      fullName: fullName || "",
      email: email || "",
      phone: phone || "",
      linkedin: linkedin || "",
    });
  }, [
    watchedValues.fullName,
    watchedValues.email,
    watchedValues.phone,
    watchedValues.linkedin,
    updateStep1Data,
  ]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-yellow-400">
          Personal Information
        </h2>
        <p className="text-white/50 text-sm">Tell us about yourself</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-yellow-400/90">
                Full Name *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your full name"
                  {...field}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
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
            <FormItem>
              <FormLabel className="text-sm font-semibold text-yellow-400/90">
                Email Address *
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-yellow-400/90">
                Phone Number *
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...field}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="linkedin"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-yellow-400/90">
                LinkedIn Profile
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  {...field}
                  value={field.value || ""}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
