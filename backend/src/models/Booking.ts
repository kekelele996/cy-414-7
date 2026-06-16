import { z } from 'zod'
import { BookingStatus, BookingStatusTransitions } from '../constants/booking'

export const bookingCreateSchema = z.object({
  courseId: z.number().int().positive(),
  scheduleTime: z.string().datetime({ offset: true }),
  note: z.string().max(500).optional()
})

export const coachFeedbackSchema = z.object({
  coachFeedback: z.string().max(2000)
})

export const bookingStatusSchema = z.enum([
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED
])

export const BOOKING_MODEL_STATUS_MACHINE = BookingStatusTransitions

