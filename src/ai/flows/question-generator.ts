'use server';

/**
 * @fileOverview A Genkit flow for synthesizing high-yield MedTech board exam questions.
 * It mimics the style of authoritative review books like Stevens, Rodak's, and Bishop.
 *
 * - generateQuestions - Handles the AI generation process.
 * - QuestionGeneratorInput - Input for the generation (subject, count).
 * - QuestionGeneratorOutput - Array of synthesized clinical questions.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuestionGeneratorInputSchema = z.object({
  subject: z.string().describe('The clinical sector, e.g., "Hematology", "Microbiology".'),
  count: z.number().min(1).max(10).default(5).describe('Number of questions to generate.'),
});
export type QuestionGeneratorInput = z.infer<typeof QuestionGeneratorInputSchema>;

const ChoiceSchema = z.object({
  id: z.string().describe('Choice identifier, e.g., "A", "B", "C", "D".'),
  text: z.string().describe('The choice text.'),
});

const GeneratedQuestionSchema = z.object({
  question: z.string().describe('The clinical question or case study.'),
  choices: z.array(ChoiceSchema).length(4).describe('Exactly four multiple-choice options.'),
  answerId: z.string().describe('The ID of the correct answer (A-D).'),
  rationale: z.string().describe('A detailed clinical rationale explaining why the answer is correct.'),
  tags: z.array(z.string()).describe('Keywords or related clinical topics.'),
});

const QuestionGeneratorOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});
export type QuestionGeneratorOutput = z.infer<typeof QuestionGeneratorOutputSchema>;

export async function generateQuestions(input: QuestionGeneratorInput): Promise<QuestionGeneratorOutput> {
  return questionGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'questionGeneratorPrompt',
  input: { schema: QuestionGeneratorInputSchema },
  output: { schema: GeneratedQuestionSchema },
  prompt: `You are an expert Medical Technologist and Board Review Author specializing in ASCP, AMT, and professional board examinations.

Your task is to synthesize {{{count}}} high-yield multiple-choice questions for the clinical sector: {{{subject}}}.

Guidelines:
1. Mimic the complexity and clinical depth of authoritative sources like Stevens (Immunology), Rodak's (Hematology), or Bishop (Clinical Chemistry).
2. Questions should range from basic recall to complex case study analysis.
3. Ensure the distractors (incorrect choices) are plausible clinical alternatives.
4. Provide a "Clinical Rationale" that explains the underlying pathophysiology or laboratory principle.
5. Focus on high-yield board topics (e.g., coagulation cascades, biochemical pathways, microscopic identification).

Generate the questions one by one.
`
});

const questionGeneratorFlow = ai.defineFlow(
  {
    name: 'questionGeneratorFlow',
    inputSchema: QuestionGeneratorInputSchema,
    outputSchema: QuestionGeneratorOutputSchema,
  },
  async (input) => {
    const questions = [];
    for (let i = 0; i < input.count; i++) {
      const { output } = await prompt(input);
      if (output) {
        questions.push({
          ...output,
          id: `ai-gen-${Date.now()}-${i}`,
          subject: input.subject
        });
      }
    }
    return { questions };
  }
);
