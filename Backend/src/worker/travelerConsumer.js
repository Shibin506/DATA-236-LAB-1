const kafkaService = require('../services/kafka')
const { pool } = require('../config/database')

// Traveler consumer: listens for booking status updates and updates the database
// This represents the "Transaction Service" consuming status updates from backend

async function handleStatusUpdate(msg) {
  try {
    const bookingId = msg.booking_id || msg.bookingId || msg.id
    const status = msg.status
    const reason = msg.reason || null
    
    if (!bookingId || !status) {
      console.warn('Invalid status message, missing booking_id or status', msg)
      return
    }

    console.log(`Processing status update for booking ${bookingId}: ${status}`)

    try {
      // Update booking status in database
      const updateQuery = `
        UPDATE bookings 
        SET status = ?, 
            updated_at = NOW()
            ${reason ? ', cancellation_reason = ?' : ''}
        WHERE id = ?
      `
      const params = reason ? [status, reason, bookingId] : [status, bookingId]
      
      const [result] = await pool.execute(updateQuery, params)
      
      if (result.affectedRows > 0) {
        console.log(`✅ Booking ${bookingId} status updated to ${status}`)
        
        // Optional: Publish notification event for real-time updates to frontend
        await kafkaService.produce('bookings.notifications', {
          booking_id: bookingId,
          status: status,
          reason: reason,
          timestamp: new Date().toISOString()
        })
      } else {
        console.warn(`⚠️ No booking found with id ${bookingId}`)
      }
    } catch (err) {
      console.error('Failed to update booking status in database:', err && err.message)
    }
  } catch (err) {
    console.error('Error handling status update message:', err)
  }
}

async function start() {
  console.log('Starting traveler consumer...')
  try {
    // Ensure kafka producer is initialized
    await kafkaService.init()
    // Use groupId to allow scaling workers
    await kafkaService.consume('bookings.status', 'traveler-service-group', handleStatusUpdate)
  } catch (err) {
    console.error('Traveler consumer failed to start:', err)
    process.exit(1)
  }
}

start()
