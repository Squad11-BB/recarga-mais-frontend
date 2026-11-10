// Gera os ícones do app a partir das logomarcas originais em marca/.
//
// Cada SVG original traz dois PNGs embutidos: o símbolo colorido e uma máscara
// de luminância que define a transparência. Aqui juntamos os dois em um PNG
// com fundo transparente e montamos as variações usadas pelo app e pelo PWA.
//
// Uso: npm run icones

import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AMARELO = '#FCDF30'

async function extrairSimbolo(arquivoSvg) {
  const svg = await readFile(path.join(raiz, 'marca', arquivoSvg), 'utf8')
  const imagens = [...svg.matchAll(/href="data:image\/png;base64,([^"]+)"/g)].map((m) =>
    Buffer.from(m[1], 'base64'),
  )
  if (imagens.length !== 2) {
    throw new Error(`${arquivoSvg}: esperava 2 imagens embutidas, achei ${imagens.length}`)
  }
  const [mascara, cor] = imagens
  const { width, height } = await sharp(cor).metadata()
  const alfa = await sharp(mascara).resize(width, height).grayscale().raw().toBuffer()
  const rgb = await sharp(cor).removeAlpha().raw().toBuffer()

  const rgba = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = rgb[i * 3]
    rgba[i * 4 + 1] = rgb[i * 3 + 1]
    rgba[i * 4 + 2] = rgb[i * 3 + 2]
    rgba[i * 4 + 3] = alfa[i]
  }
  // Recorta a margem transparente para o símbolo ocupar a área toda.
  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer()
}

async function noQuadrado(simbolo, tamanho, ocupacao, destino) {
  const lado = Math.round(tamanho * ocupacao)
  const miolo = await sharp(simbolo)
    .resize(lado, lado, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
  await sharp({
    create: { width: tamanho, height: tamanho, channels: 4, background: AMARELO },
  })
    .composite([{ input: miolo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(destino)
}

async function main() {
  const publico = path.join(raiz, 'public')
  await mkdir(path.join(publico, 'icons'), { recursive: true })
  await mkdir(path.join(publico, 'marca'), { recursive: true })

  for (const [svg, nome] of [
    ['opcao-1.svg', 'simbolo-opcao-1.png'],
    ['opcao-2.svg', 'simbolo-opcao-2.png'],
  ]) {
    const simbolo = await extrairSimbolo(svg)
    await sharp(simbolo)
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(path.join(publico, 'marca', nome))
  }

  // Os ícones do app usam a opção 1, a mesma das telas do documento.
  const simbolo = await extrairSimbolo('opcao-1.svg')
  await noQuadrado(simbolo, 192, 0.82, path.join(publico, 'icons', 'icon-192.png'))
  await noQuadrado(simbolo, 512, 0.82, path.join(publico, 'icons', 'icon-512.png'))
  // Ícone "maskable": o sistema pode cortar até 20% das bordas.
  await noQuadrado(simbolo, 512, 0.6, path.join(publico, 'icons', 'maskable-512.png'))
  await noQuadrado(simbolo, 180, 0.8, path.join(publico, 'icons', 'apple-touch-icon.png'))
  await noQuadrado(simbolo, 64, 0.86, path.join(publico, 'favicon.png'))

  console.log('Ícones gerados em public/icons e public/marca.')
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
