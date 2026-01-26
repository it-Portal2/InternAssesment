import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InsertApplicationForm } from "@/lib/validation";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useEffect } from "react";

interface StepPredefinedQuestionsProps {
  form: UseFormReturn<InsertApplicationForm>;
}

export default function StepPredefinedQuestions({
  form,
}: StepPredefinedQuestionsProps) {
  const { updateStep2Data } = useApplicationStore();
  const watchedValues = form.watch();
  const startDateValue = form.watch("startDate");

  useEffect(() => {
    const { stipendExpectation, startDate, weeklyCommitment, trialAccepted } =
      watchedValues;
    updateStep2Data({
      stipendExpectation: stipendExpectation || "",
      startDate: startDate || "",
      weeklyCommitment: weeklyCommitment || "",
      trialAccepted: trialAccepted || "",
    });
  }, [
    watchedValues.stipendExpectation,
    watchedValues.startDate,
    watchedValues.weeklyCommitment,
    watchedValues.trialAccepted,
    updateStep2Data,
  ]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-yellow-400">
          Predefined Questions
        </h2>
        <p className="text-white/50 text-sm">
          Help us understand your availability and expectations
        </p>
      </div>

      <div className="space-y-8">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-yellow-400/90 mb-4 block">
                When can you start the internship? *
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="immediately"
                      id="immediately"
                      className="border-gray-600 text-yellow-500"
                    />
                    <Label
                      htmlFor="immediately"
                      className="text-white font-medium"
                    >
                      Immediately
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="within-week"
                      id="within-week"
                      className="border-gray-600 text-yellow-500"
                    />
                    <Label
                      htmlFor="within-week"
                      className="text-white font-medium"
                    >
                      Within 1 week
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="within-month"
                      id="within-month"
                      className="border-gray-600 text-yellow-500"
                    />
                    <Label
                      htmlFor="within-month"
                      className="text-white font-medium"
                    >
                      Within 1 month
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="custom"
                      id="custom"
                      className="border-gray-600 text-yellow-500"
                    />
                    <Label htmlFor="custom" className="text-white font-medium">
                      Other (specify below)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              {startDateValue === "custom" && (
                <Input
                  placeholder="Specify your preferred start date"
                  className="mt-3 bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
                  onChange={(e) => form.setValue("startDate", e.target.value)}
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weeklyCommitment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-yellow-400/90 mb-4 block">
                How many hours per week can you dedicate to this internship? *
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white focus:border-yellow-500 focus:ring-yellow-500/20">
                    <SelectValue placeholder="Select hours per week" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem
                    value="10-15"
                    className="text-white hover:bg-yellow-500/10"
                  >
                    10-15 hours
                  </SelectItem>
                  <SelectItem
                    value="16-25"
                    className="text-white hover:bg-yellow-500/10"
                  >
                    16-25 hours
                  </SelectItem>
                  <SelectItem
                    value="26-35"
                    className="text-white hover:bg-yellow-500/10"
                  >
                    26-35 hours
                  </SelectItem>
                  <SelectItem
                    value="36-40"
                    className="text-white hover:bg-yellow-500/10"
                  >
                    36-40 hours
                  </SelectItem>
                  <SelectItem
                    value="40+"
                    className="text-white hover:bg-yellow-500/10"
                  >
                    40+ hours
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trialAccepted"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-300 mb-4 block">
                Are you ready for a 7-day trial period before finalizing the
                offer? *
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="yes"
                      id="trial-yes"
                      className="border-gray-600 text-yellow-500"
                    />
                    <Label
                      htmlFor="trial-yes"
                      className="text-white font-medium"
                    >
                      Yes, I accept the trial period
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value="no"
                      id="trial-no"
                      className="border-gray-600 text-yellow-500"
                    />
                    <Label
                      htmlFor="trial-no"
                      className="text-white font-medium"
                    >
                      No, I prefer to skip the trial
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stipendExpectation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-gray-300 mb-4 block">
                What is your stipend expectation? *
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., ₹5000/month INR"
                  {...field}
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
