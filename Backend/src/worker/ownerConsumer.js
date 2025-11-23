const kafkaService = require('../services/kafka')
const bookingService = require('../services/bookingService')

// Owner consumer: listens for booking requests and auto-accepts them.
// In a real system the owner would be notified and accept/reject via UI.

async function handleMessage(msg) {
  try {
    const bookingId = msg.booking_id || msg.bookingId || msg.id
    const ownerId = msg.owner_id || msg.ownerId
    if (!bookingId || !ownerId) {
      console.warn('Invalid booking message, missing booking_id or owner_id', msg)
      return
    }

    console.log(`Processing booking ${bookingId} for owner ${ownerId}`)

    try {
      // Attempt to accept the booking via bookingService (will validate owner)
      await bookingService.acceptBooking(bookingId, ownerId)
      const statusMsg = { booking_id: bookingId, status: 'accepted', processed_at: new Date().toISOString() }
      await kafkaService.produce('bookings.status', statusMsg)
      console.log(`Booking ${bookingId} accepted and status published`)
    } catch (err) {
      console.warn('Failed to accept booking via bookingService, publishing rejected status', err && err.message)
      const statusMsg = { booking_id: bookingId, status: 'rejected', reason: err && err.message, processed_at: new Date().toISOString() }
      await kafkaService.produce('bookings.status', statusMsg)
    }
  } catch (err) {
    console.error('Error handling booking request message', err)
  }
}

async function start() {
  console.log('Starting owner consumer...')
  try {
    // Ensure kafka producer is initialized (kafkaService.init called in server start; call here too for standalone runs)
    await kafkaService.init()
    // Use groupId to allow scaling workers
    await kafkaService.consume('bookings.requests', 'owner-service-group', handleMessage)
  } catch (err) {
    console.error('Owner consumer failed to start:', err)
    process.exit(1)
  }
}

start()
