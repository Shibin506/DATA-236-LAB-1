const { Kafka } = require('kafkajs')

// Simple Kafka wrapper using kafkajs
class KafkaService {
  constructor() {
    this.kafka = null
    this.producer = null
    this.consumer = null
    this.isConnected = false
    this.brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
    this.clientId = process.env.KAFKA_CLIENT_ID || 'airbnb-backend'
  }

  async init() {
    if (this.kafka) return
    this.kafka = new Kafka({ clientId: this.clientId, brokers: this.brokers })
    this.producer = this.kafka.producer()
    try {
      await this.producer.connect()
      this.isConnected = true
      console.log('✅ Kafka producer connected')
    } catch (err) {
      this.isConnected = false
      console.warn('⚠️ Kafka producer failed to connect:', err.message)
    }
  }

  async produce(topic, messageObj) {
    if (!this.producer || !this.isConnected) {
      console.warn('Kafka producer not connected, skipping message to topic:', topic)
      return
    }
    try {
      const payload = { value: JSON.stringify(messageObj) }
      await this.producer.send({ topic, messages: [payload] })
    } catch (err) {
      console.error('Kafka produce error:', err.message)
      // Mark as disconnected on error
      this.isConnected = false
    }
  }

  // Basic helper to run a consumer for a given topic and groupId with a handler
  async consume(topic, groupId, onMessage) {
    if (!this.kafka) this.kafka = new Kafka({ clientId: this.clientId, brokers: this.brokers })
    const consumer = this.kafka.consumer({ groupId })
    try {
      await consumer.connect()
      await consumer.subscribe({ topic, fromBeginning: false })
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const parsed = JSON.parse(message.value.toString())
            await onMessage(parsed)
          } catch (err) {
            console.error('Error handling kafka message', err)
          }
        }
      })
    } catch (err) {
      console.error('Kafka consumer error:', err)
    }
  }
}

module.exports = new KafkaService()
