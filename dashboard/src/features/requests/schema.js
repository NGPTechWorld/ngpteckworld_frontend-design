import { z } from 'zod'
import { emptyToNull, optionalText } from '@/lib/validation'

/** Internal notes: free text, ≤ 5000 characters (mirrors the API rule). */
export const makeNotesSchema = (c) => z.object({ admin_notes: optionalText(c, 5000) })

export const toNotesValues = (request) => ({ admin_notes: request.admin_notes ?? '' })

/** '' clears the notes on the server (null). */
export const toNotesPayload = (values) => ({ admin_notes: emptyToNull(values.admin_notes) })
