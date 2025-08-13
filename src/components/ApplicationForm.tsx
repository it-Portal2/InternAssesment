import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {  toast } from 'sonner'
import FileUpload from "./steps/FileUpload";

import { apiRequest } from "@/lib/queryClient";

interface ApplicationFormProps {
  onSubmitted: (applicationId: string) => void;
}

export default function ApplicationForm({ onSubmitted }: ApplicationFormProps) {
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(
    null
  );
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [isProcessingResume, setIsProcessingResume] = useState(false);


  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      linkedin: "",
      stipendExpectation: "",
      startDate: "",
      weeklyCommitment: "",
      trialAccepted: "",
      additionalComments: "",
      resumeAnalysis: {
        skills: [],
        experience: "",
        education: "",
        summary: "",
      },
      responses: {},
      aiQuestions: [],
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (data: InsertApplication) => {
      const response = await apiRequest("POST", "/api/applications", data);
      return response.json();
    },
    onSuccess: (application) => {
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });
      onSubmitted(application.id);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    },
  });



  const onSubmit = (data: InsertApplication) => {
    // Collect AI question answers
    const aiQuestionsWithAnswers = aiQuestions.map((q) => ({
      ...q,
      answer: form.getValues(`responses.ai_${q.id}` as any) || "",
    }));

    const submissionData = {
      ...data,
      aiQuestions: aiQuestionsWithAnswers,
    };

    submitApplication.mutate(submissionData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-primary-500 to-accent-500">
        <h2 className="text-2xl font-bold text-white">
          Internship Application
        </h2>
        <p className="text-primary-100 mt-1">
          Complete all sections to submit your application
        </p>
      </div>

      <div className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-900">
                      Full Name *
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
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
                    <FormLabel className="text-sm font-semibold text-gray-900">
                      Email Address *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
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
                    <FormLabel className="text-sm font-semibold text-gray-900">
                      Phone Number *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        {...field}
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
                    <FormLabel className="text-sm font-semibold text-gray-900">
                      LinkedIn Profile
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resume Upload */}
            <FileUpload

            />

            {/* Predefined Questions */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
                Application Questions
              </h3>

              <div className="grid gap-6">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-900 mb-3">
                        When can you start the internship? *
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="immediately"
                                id="immediately"
                              />
                              <Label
                                htmlFor="immediately"
                                className="text-gray-700"
                              >
                                Immediately
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="within-week"
                                id="within-week"
                              />
                              <Label
                                htmlFor="within-week"
                                className="text-gray-700"
                              >
                                Within 1 week
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="within-month"
                                id="within-month"
                              />
                              <Label
                                htmlFor="within-month"
                                className="text-gray-700"
                              >
                                Within 1 month
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="custom" id="custom" />
                              <Label htmlFor="custom" className="text-gray-700">
                                Other (specify below)
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <Input
                        placeholder="Specify your preferred start date"
                        className="mt-3"
                        onChange={(e) => {
                          if (form.getValues("startDate") === "custom") {
                            form.setValue("startDate", e.target.value);
                          }
                        }}
                      />
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
                      <FormLabel className="text-sm font-semibold text-gray-900 mb-3">
                        How many hours per week can you dedicate to this
                        internship? *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
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
                      <FormLabel className="text-sm font-semibold text-gray-900 mb-3">
                        Are you ready for a 7-day trial period before finalizing
                        the offer? *
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="trial-yes" />
                              <Label
                                htmlFor="trial-yes"
                                className="text-gray-700"
                              >
                                Yes, I accept the trial period
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="trial-no" />
                              <Label
                                htmlFor="trial-no"
                                className="text-gray-700"
                              >
                                No, I prefer to skip the trial
                              </Label>
                            </div>
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
                      <FormLabel className="text-sm font-semibold text-gray-900 mb-3">
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

            {/* AI-Generated Questions */}
            {aiQuestions.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    Personalized Questions
                  </h3>
                  <div className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                    <i className="fas fa-robot mr-1"></i>AI Generated
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-info-circle mr-2"></i>
                    These questions are tailored based on your resume content
                    and experience.
                  </p>
                </div>

                <div className="space-y-6">
                  {aiQuestions.map((question) => (
                    <FormField
                      key={question.id}
                      control={form.control}
                      name={`responses.ai_${question.id}` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-900">
                            {question.question}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Share your thoughts and experience..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Additional Comments */}
            <FormField
              control={form.control}
              name="additionalComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900">
                    Additional Comments or Questions
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Anything else you'd like us to know..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={submitApplication.isPending || !resumeAnalysis}
                className="w-full bg-primary-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
              >
                {submitApplication.isPending ? (
                  <>
                    <i className="fas fa-spinner animate-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>Submit
                    Application
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-gray-500 mt-3">
                By submitting, you agree to our terms and conditions
              </p>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
