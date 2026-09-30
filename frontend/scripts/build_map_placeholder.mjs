// Статичная SVG-заглушка карты: субъекты РФ из russia.topo.json в «фейковых» цветах светофора.
// Показывается, пока грузится MapLibre. Запуск: node scripts/build_map_placeholder.mjs
import { readFileSync, writeFileSync } from 'node:fs'

import { geoConicEqualArea, geoPath, geoTransform } from 'd3-geo'
import { feature } from 'topojson-client'

const WIDTH = 600
const HEIGHT = 340
const COLORS = ['#ef3e46', '#f7b52c', '#34b75a', '#34b75a', '#c7c9cf']

const topology = JSON.parse(readFileSync(new URL('../src/assets/geo/russia.topo.json', import.meta.url)))
const regions = feature(topology, topology.objects.russia)
const projection = geoConicEqualArea().rotate([-100, 0]).parallels([52, 64]).fitSize([WIDTH, HEIGHT], regions)

// ponytail: упрощение — выкидываем точки ближе 1.5px к предыдущей, для заглушки хватает; нужна точность — topojson-simplify
let last = null
const simplify = geoTransform({
  point(x, y) {
    if (last && Math.hypot(x - last[0], y - last[1]) < 1.5) return
    last = [x, y]
    this.stream.point(Math.round(x), Math.round(y))
  },
  lineStart() {
    last = null
    this.stream.lineStart()
  },
})
const path = geoPath({ stream: (s) => projection.stream(simplify.stream(s)) })

// Цвет детерминирован по коду региона, чтобы заглушка не менялась от сборки к сборке
const colorOf = (code) => COLORS[[...code].reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLORS.length]

const paths = regions.features
  .map((region) => `<path fill="${colorOf(region.properties.code)}" d="${path(region)}"/>`)
  .join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><g fill-opacity=".45" stroke="#fff" stroke-width=".8">${paths}</g></svg>\n`
writeFileSync(new URL('../src/assets/geo/russia-placeholder.svg', import.meta.url), svg)
console.log(`russia-placeholder.svg: ${(svg.length / 1024).toFixed(1)} KB`)
