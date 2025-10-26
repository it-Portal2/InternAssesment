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

export default function StepPredefinedQuestions({ form }: StepPredefinedQuestionsProps) {
 const { updateStep2Data } = useApplicationStore();
  const watchedValues = form.watch();
  const startDateValue = form.watch("startDate");

  // Sync with Zustand store
  useEffect(() => {
    const { stipendExpectation, startDate, weeklyCommitment, trialAccepted } = watchedValues;
    updateStep2Data({
      stipendExpectation: stipendExpectation || "",
      startDate: startDate || "",
      weeklyCommitment: weeklyCommitment || "",
      trialAccepted: trialAccepted || "",
    });
  }, [watchedValues.stipendExpectation, watchedValues.startDate, watchedValues.weeklyCommitment, watchedValues.trialAccepted, updateStep2Data]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Predefined Questions</h2>
        <p className="text-muted-foreground">Help us understand your availability and expectations</p>
      </div>

      <div className="space-y-8">
        {/* Start Date */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-foreground mb-4 block">
                When can you start the internship? *
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="immediately" id="immediately" />
                    <Label htmlFor="immediately" className="text-foreground font-medium">
                      Immediately
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="within-week" id="within-week" />
                    <Label htmlFor="within-week" className="text-foreground font-medium">
                      Within 1 week
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="within-month" id="within-month" />
                    <Label htmlFor="within-month" className="text-foreground font-medium">
                      Within 1 month
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="text-foreground font-medium">
                      Other (specify below)
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              {startDateValue === "custom" && (
                <Input
                  placeholder="Specify your preferred start date"
                  className="mt-3"
                  onChange={(e) => form.setValue("startDate", e.target.value)}
                />
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Weekly Commitment */}
        <FormField
          control={form.control}
          name="weeklyCommitment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-foreground mb-4 block">
                How many hours per week can you dedicate to this internship? *
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hours per week" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="10-15">10-15 hours</SelectItem>
                  <SelectItem value="16-25">16-25 hours</SelectItem>
                  <SelectItem value="26-35">26-35 hours</SelectItem>
                  <SelectItem value="36-40">36-40 hours</SelectItem>
                  <SelectItem value="40+">40+ hours</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trial Period */}
        <FormField
          control={form.control}
          name="trialAccepted"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-foreground mb-4 block">
                Are you ready for a 7-day trial period before finalizing the offer? *
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="yes" id="trial-yes" />
                    <Label htmlFor="trial-yes" className="text-foreground font-medium">
                      Yes, I accept the trial period
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="no" id="trial-no" />
                    <Label htmlFor="trial-no" className="text-foreground font-medium">
                      No, I prefer to skip the trial
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stipend Expectation */}
        <FormField
          control={form.control}
          name="stipendExpectation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-foreground mb-4 block">
                What is your stipend expectation? *
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., ₹5000/month INR" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}