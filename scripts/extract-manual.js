const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const pdfPath = '/Users/andersonnonato/Downloads/Manual-da-Igreja-do-Nazareno_2023-2027.pdf'
const outputPath = path.join(__dirname, '..', 'manual_nazareno.txt')

async function main() {
  const dataBuffer = fs.readFileSync(pdfPath)
  const data = await pdf(dataBuffer)
  fs.writeFileSync(outputPath, data.text, 'utf8')
  const sizeKB = Math.round(fs.statSync(outputPath).size / 1024)
  console.log(`✅ Texto extraído com sucesso!`)
  console.log(`📄 Total de páginas: ${data.numpages}`)
  console.log(`📝 Tamanho do arquivo: ${sizeKB} KB`)
  console.log(`📁 Salvo em: ${outputPath}`)
}

main().catch(console.error)
