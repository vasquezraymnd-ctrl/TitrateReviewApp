'use server';

/**
 * @fileOverview A Genkit flow for suggesting optimal 30-minute 'high-yield' study blocks.
 * It analyzes the user's class schedule, academic performance, and upcoming exam date
 * to generate a personalized study plan.
 *
 * - suggestStudyBlocks - A function that handles the study block suggestion process.
 * - SmartStudyBlockSuggesterInput - The input type for the suggestStudyBlocks function.
 * - SmartStudyBlockSuggesterOutput - The return type for the suggestStudyBlocks function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ClassScheduleEntrySchema = z.object({
  dayOfWeek: z.string().describe('Day of the week, e.g., "Monday", "Tuesday".'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe('Start time in HH:MM format (24-hour).'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).describe('End time in HH:MM format (24-hour).'),
});

const PerformanceDataEntrySchema = z.object({
  subjectName: z.string().describe('Name of the subject, e.g., "Microbiology", "Hematology".'),
  averageScore: z.number().min(0).max(100).describe('Average score for the subject (0-100).'),
  lastReviewDate: z.string().datetime().describe('ISO 8601 string of the last review date for the subject.'),
});

const SmartStudyBlockSuggesterInputSchema = z.object({
  classSchedule: z.array(ClassScheduleEntrySchema).describe('User\'s weekly class schedule.'),
  performanceData: z.array(PerformanceDataEntrySchema).describe('User\'s performance data across various subjects.'),
  examDate: z.string().datetime().describe('ISO 8601 string of the upcoming board exam date.'),
  currentDateTime: z.string().datetime().describe('ISO 8601 string of the current date and time.'),
});
export type SmartStudyBlockSuggesterInput = z.infer<typeof SmartStudyBlockSuggesterInputSchema>;

const SuggestedStudyBlockSchema = z.object({
  subject: z.string().describe('Suggested subject to study.'),
  startTime: z.string().datetime().describe('ISO 8601 string of the start time for the 30-minute study block.'),
  endTime: z.string().datetime().describe('ISO 8601 string of the end time for the 30-minute study block.'),
  reason: z.string().describe('Explanation for why this subject and time were chosen (e.g., "Weakest subject, available slot").'),
});

const SmartStudyBlockSuggesterOutputSchema = z.object({
  suggestedBlocks: z.array(SuggestedStudyBlockSchema).describe('A list of suggested 30-minute study blocks.'),
  countdownToExam: z.string().describe('A human-readable countdown to the board exam date.'),
});
export type SmartStudyBlockSuggesterOutput = z.infer<typeof SmartStudyBlockSuggesterOutputSchema>;

export async function suggestStudyBlocks(input: SmartStudyBlockSuggesterInput): Promise<SmartStudyBlockSuggesterOutput> {
  return smartStudyBlockSuggesterFlow(input);
}

// Helper function to calculate countdown
function calculateCountdown(examDateStr: string, currentDateTimeStr: string): string {
  const examDate = new Date(examDateStr);
  const currentDateTime = new Date(currentDateTimeStr);

  if (examDate < currentDateTime) {
    return "The exam date has passed.";
  }

  const diffTime = examDate.getTime() - currentDateTime.getTime(); // Positive difference now
  const diffMinutes = Math.floor(diffTime / (1000 * 60));

  if (diffMinutes <= 0) {
      return "The exam is happening now or very soon!";
  }

  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  let countdownParts: string[] = [];
  if (diffDays > 0) {
      countdownParts.push(`${diffDays} day${diffDays > 1 ? 's' : ''}`);
  }
  if (remainingHours > 0) {
      countdownParts.push(`${remainingHours} hour${remainingHours > 1 ? 's' : ''}`);
  }
  if (remainingMinutes > 0 || countdownParts.length === 0) { // Ensure at least minutes if nothing else
      countdownParts.push(`${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`);
  }

  return countdownParts.length > 0 ? `${countdownParts.join(', ')} until the exam.` : "The exam is very soon!";
}

const prompt = ai.definePrompt({
  name: 'smartStudyBlockSuggesterPrompt',
  input: { schema: SmartStudyBlockSuggesterInputSchema },
  output: { schema: SmartStudyBlockSuggesterOutputSchema },
  prompt: `You are an intelligent study block planner for a busy MedTech student. Your goal is to analyze the student's class schedule, academic performance, and upcoming exam date to suggest optimal 30-minute 'high-yield' study blocks. Focus on the student's weakest subjects or most critical exam topics.

Current Date and Time: {{{currentDateTime}}}
Current Day of Week: {{{currentDayOfWeek}}}
Current Time (HH:MM 24-hour): {{{currentTime}}}
Board Exam Date: {{{examDate}}}

Student's Weekly Class Schedule:
{{#if classSchedule}}
{{#each classSchedule}}
- {{this.dayOfWeek}}: {{this.startTime}} to {{this.endTime}}
{{/each}}
{{else}}
No class schedule provided. Assume full availability except for reasonable sleep hours (e.g., 11 PM to 7 AM).
{{/if}}

Student's Performance Data:
{{#if performanceData}}
{{#each performanceData}}
- Subject: {{this.subjectName}}, Average Score: {{this.averageScore}}%, Last Reviewed: {{this.lastReviewDate}}
{{/each}}
{{else}}
No performance data provided. Prioritize core MedTech subjects evenly.
{{/if}}

Based on the information above, suggest up to 5-10 optimal 30-minute 'high-yield' study blocks for the next 24-48 hours.
Identify available time slots by avoiding conflicts with the class schedule.
Prioritize subjects where the student has a lower average score or subjects that haven't been reviewed recently.
Ensure each suggested block is exactly 30 minutes long.
Provide a clear reason for each suggestion.

Output your suggestions as a JSON object with two fields: 'suggestedBlocks' (an array of objects, each containing 'subject', 'startTime', 'endTime' (valid ISO 8601 format), and 'reason') and 'countdownToExam' (a human-readable string).
`
});

const smartStudyBlockSuggesterFlow = ai.defineFlow(
  {
    name: 'smartStudyBlockSuggesterFlow',
    inputSchema: SmartStudyBlockSuggesterInputSchema,
    outputSchema: SmartStudyBlockSuggesterOutputSchema,
  },
  async (input) => {
    const current = new Date(input.currentDateTime);
    const currentDayOfWeek = current.toLocaleString('en-US', { weekday: 'long' });
    const currentTime = current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const promptInput = {
      ...input,
      currentDayOfWeek,
      currentTime,
    };

    const { output } = await prompt(promptInput);

    const calculatedCountdown = calculateCountdown(input.examDate, input.currentDateTime);

    if (output) {
      const suggestedBlocks = Array.isArray(output.suggestedBlocks)
        ? output.suggestedBlocks.map((block: any) => ({
            subject: block.subject || 'Unknown Subject',
            startTime: block.startTime || new Date().toISOString(), // Fallback if LLM fails
            endTime: block.endTime || new Date(new Date().getTime() + 30 * 60 * 1000).toISOString(), // Fallback
            reason: block.reason || 'AI suggestion based on analysis',
          }))
        : [];

      return {
        suggestedBlocks: suggestedBlocks,
        countdownToExam: output.countdownToExam || calculatedCountdown, // Prefer LLM's countdown if provided and valid
      };
    } else {
      // Handle cases where output is null or undefined
      return {
        suggestedBlocks: [],
        countdownToExam: calculatedCountdown,
      };
    }
  }
);
