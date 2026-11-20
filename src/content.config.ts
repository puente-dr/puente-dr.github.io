import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Puente's additions to Starlight's front matter:
//   related   — slugs shown as "Related articles" at the foot of the page
//   roles     — guides only: who the guide is for (the two roles Puente has)
//   format    — guides only: guide or checklist
//   minutes   — guides only: reading time shown on the guides list
//   thumbnail — guides only: picture on the guides list
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: ({ image }) => z.object({
        related: z.array(z.string()).optional(),
        roles: z.array(z.enum(['data-collector', 'data-manager'])).optional(),
        format: z.enum(['guide', 'checklist']).optional(),
        minutes: z.number().optional(),
        thumbnail: image().optional(),
      }),
    }),
  }),
};
