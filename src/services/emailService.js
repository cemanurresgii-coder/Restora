/**
 * Email & SMS Service
 * ------------------
 * Logs every outbound email/SMS to the Firestore `emailLog` collection
 * so managers can review all communications in the Reports tab.
 *
 * To activate real delivery, fill in your EmailJS credentials in the
 * EMAILJS_* constants below and uncomment the sendEmail() call inside
 * _dispatch(). Free-tier EmailJS allows ~200 emails/month.
 *
 * SMS delivery (Twilio) requires a server-side function; the log entry
 * is created the same way so the history is preserved regardless.
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ── EmailJS configuration ────────────────────────────────────────────────────
// Sign up at https://www.emailjs.com/, create a service + template, then fill:
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  ?? ''
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? ''
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  ?? ''

const EMAILJS_CONFIGURED =
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY

const COL = 'emailLog'

export const EMAIL_TYPE = {
  RESERVATION_RECEIVED:  'reservation_received',
  RESERVATION_CONFIRMED: 'reservation_confirmed',
  RESERVATION_CANCELLED: 'reservation_cancelled',
  ORDER_PLACED:          'order_placed',
  ORDER_PREPARING:       'order_preparing',
  ORDER_READY:           'order_ready',
  ORDER_SERVED:          'order_served',
  PASSWORD_RESET:        'password_reset',
}

const TYPE_LABELS = {
  [EMAIL_TYPE.RESERVATION_RECEIVED]:  'Reservation Received',
  [EMAIL_TYPE.RESERVATION_CONFIRMED]: 'Reservation Confirmed',
  [EMAIL_TYPE.RESERVATION_CANCELLED]: 'Reservation Cancelled',
  [EMAIL_TYPE.ORDER_PLACED]:          'Order Placed',
  [EMAIL_TYPE.ORDER_PREPARING]:       'Order Preparing',
  [EMAIL_TYPE.ORDER_READY]:           'Order Ready',
  [EMAIL_TYPE.ORDER_SERVED]:          'Order Served',
  [EMAIL_TYPE.PASSWORD_RESET]:        'Password Reset',
}

// ── Core dispatcher ──────────────────────────────────────────────────────────

async function _dispatch({ to, subject, body, type, channel = 'email' }) {
  // 1. Persist log entry to Firestore
  try {
    await addDoc(collection(db, COL), {
      to,
      subject,
      body,
      type,
      typeLabel: TYPE_LABELS[type] ?? type,
      channel,
      status: EMAILJS_CONFIGURED ? 'sent' : 'simulated',
      createdAt: Timestamp.now(),
    })
  } catch (err) {
    console.error('[EmailService] Failed to log email:', err)
  }

  // 2. Attempt real delivery via EmailJS if configured
  if (EMAILJS_CONFIGURED && channel === 'email') {
    try {
      // Lazy-load EmailJS SDK so it never breaks the bundle if not installed
      const emailjs = await import('@emailjs/browser').then((m) => m.default ?? m)
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        { to_email: to, subject, message: body },
        EMAILJS_PUBLIC_KEY,
      )
    } catch (err) {
      console.warn('[EmailService] EmailJS delivery failed:', err?.text ?? err)
    }
  }

  // 3. Always log to console (useful in dev / when EmailJS not configured)
  console.info(`[${channel.toUpperCase()}] → ${to}\nSubject: ${subject}\n${body}`)
}

// ── Semantic helpers ─────────────────────────────────────────────────────────

export const sendReservationReceived = (email, { date, time, guests, tableId }) =>
  _dispatch({
    to: email,
    subject: 'Reservation Request Received — Restora',
    body: `Hi there,\n\nWe've received your reservation request for ${guests} guest(s) on ${date} at ${time} (Table ${tableId}).\n\nYour booking is currently PENDING and will be confirmed by our team shortly. We'll send you another email once it's approved.\n\nThank you for choosing Restora!\n\n— The Restora Team`,
    type: EMAIL_TYPE.RESERVATION_RECEIVED,
  })

export const sendReservationConfirmed = (email, { date, time, guests, tableId, zone }) =>
  _dispatch({
    to: email,
    subject: '✅ Reservation Confirmed — Restora',
    body: `Great news!\n\nYour reservation has been CONFIRMED:\n\n  📅 Date:   ${date}\n  🕐 Time:   ${time}\n  👥 Guests: ${guests}\n  🪑 Table:  ${tableId} (${zone})\n\nWe look forward to welcoming you. If you need to make any changes, please contact us at restora@example.com.\n\n— The Restora Team`,
    type: EMAIL_TYPE.RESERVATION_CONFIRMED,
  })

export const sendReservationCancelled = (email, { date, time }) =>
  _dispatch({
    to: email,
    subject: 'Reservation Cancelled — Restora',
    body: `Hi,\n\nThis is to confirm that your reservation on ${date} at ${time} has been cancelled.\n\nWe hope to see you another time. You're always welcome to make a new booking on our website.\n\n— The Restora Team`,
    type: EMAIL_TYPE.RESERVATION_CANCELLED,
  })

export const sendOrderPlaced = (email, { tableId, total }) =>
  _dispatch({
    to: email,
    subject: '🛒 Order Confirmed — Restora',
    body: `Your order has been received!\n\n  🪑 Table: ${tableId}\n  💳 Total: $${Number(total).toFixed(2)}\n\nOur kitchen is on it. You'll receive another notification once your order is being prepared.\n\nBon appétit!\n— The Restora Team`,
    type: EMAIL_TYPE.ORDER_PLACED,
  })

export const sendOrderPreparing = (email, { tableId }) =>
  _dispatch({
    to: email,
    subject: '👨‍🍳 Kitchen is Preparing Your Order — Restora',
    body: `Good news! Our kitchen has started preparing your order for Table ${tableId}.\n\nSit tight — your meal will be ready soon!\n\n— The Restora Team`,
    type: EMAIL_TYPE.ORDER_PREPARING,
  })

export const sendOrderReady = (email, { tableId }) =>
  _dispatch({
    to: email,
    subject: '🍽️ Your Order is Ready! — Restora',
    body: `Your order for Table ${tableId} is ready and will be brought to your table shortly.\n\nEnjoy your meal!\n\n— The Restora Team`,
    type: EMAIL_TYPE.ORDER_READY,
  })

export const sendOrderServed = (email, { tableId }) =>
  _dispatch({
    to: email,
    subject: '🎉 Enjoy Your Meal! — Restora',
    body: `Your order at Table ${tableId} has been served.\n\nWe hope you enjoy every bite. Don't hesitate to call a staff member if you need anything.\n\nThank you for dining with us!\n— The Restora Team`,
    type: EMAIL_TYPE.ORDER_SERVED,
  })

// ── Manager: fetch email log ─────────────────────────────────────────────────

export const getEmailLog = async (maxRows = 100) => {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(maxRows))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
