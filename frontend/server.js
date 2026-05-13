const express = require('express')
const path    = require('path')

const app  = express()
const PORT = process.env.PORT || 3000

// Archivos estáticos del build
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback — todas las rutas sirven index.html (React Router)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Frontend corriendo en http://0.0.0.0:${PORT}`)
})
