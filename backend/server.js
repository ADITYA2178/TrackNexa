require('dotenv').config()

const app = require('./src/app')
const { port } = require('./src/config')
const { connectDB } = require('./src/config/db')

async function start() {
  try {
    await connectDB()

    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `Port ${port} is already in use. Set a different PORT in .env`,
        )
      } else {
        console.error(err)
      }
      process.exit(1)
    })
  } catch (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
}

start()
