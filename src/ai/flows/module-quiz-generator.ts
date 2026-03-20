'use server';

/**
 * @fileOverview A Genkit flow for generating clinical questions from module text.
 * It analyzes specific study materials (PDF content) to create relevant MCQs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModuleQuizGeneratorInputSchema = z.object({
  subject: z.string().describe('The clinical sector, e.g., "Hematology".'),
  moduleName: z.string().describe('The title of the study module.'),
  moduleContent: z.string().describe('The text content extracted from the module PDF.'),
  count: z.number().min(1).max(10).default(5).describe('Number of questions to generate.'),
});
export type ModuleQuizGeneratorInput = z.infer<typeof ModuleQuizGeneratorInputSchema>;

const ChoiceSchema = z.object({
  id: z.string().describe('Choice identifier (A, B, C, D).'),
  text: z.string().describe('Choice text.'),
});

const GeneratedQuestionSchema = z.object({
  question: z.string().describe('A clinical question based strictly on the module content.'),
  choices: z.array(ChoiceSchema).length(4).describe('Four plausible options.'),
  answerId: z.string().describe('ID of the correct choice.'),
  rationale: z.string().describe('Pathophysiological rationale based on the module.'),
});

const ModuleQuizGeneratorOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});
export type ModuleQuizGeneratorOutput = z.infer<typeof ModuleQuizGeneratorOutputSchema>;

export async function generateModuleQuiz(input: ModuleQuizGeneratorInput): Promise<ModuleQuizGeneratorOutput> {
  return moduleQuizGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moduleQuizGeneratorPrompt',
  input: { schema: ModuleQuizGeneratorInputSchema },
  output: { schema: GeneratedQuestionSchema },
  prompt: `You are an expert Medical Technology Professor. 
Your task is to generate high-yield board-style questions based ONLY on the provided module content.

Subject: {{{subject}}}
Module Title: {{{moduleName}}}

Module Content Excerpt:
"""
{{{moduleContent}}}
"""

Instructions:
1. Synthesize {{{count}}} questions that test critical understanding of the provided text.
2. Mimic the complexity of ASCP/Board examinations.
3. Ensure distractors are plausibly related to the clinical context of the module.
4. The rationale must reference principles found in the provided text.
`
});

const moduleQuizGeneratorFlow = ai.defineFlow(
  {
    name: 'moduleQuizGeneratorFlow',
    inputSchema: ModuleQuizGeneratorInputSchema,
    outputSchema: ModuleQuizGeneratorOutputSchema,
  },
  async (input) => {
    const questions = [];
    // To ensure variety, we iterate or let the LLM handle the batch. 
    // Batch generation is more efficient for related questions.
    const { output } = await prompt({
        ...input,
        // If content is too large, we could truncate, but usually Genkit handles reasonable sizes.
        moduleContent: input.moduleContent.substring(0, 15000) 
    });

    // In a real flow we might loop to get exactly 'count', but here we define the output schema to be an array or handle multiple calls.
    // Let's call the prompt in a loop for better control of 'count'.
    for (let i = 0; i < input.count; i++) {
        const { output } = await prompt(input);
        if (output) {
            questions.push({
                ...output,
                id: `mod-gen-${Date.now()}-${i}`,
                subject: input.subject,
                tags: [input.moduleName]
            });
        }
    }
    
    return { questions };
  }
);
