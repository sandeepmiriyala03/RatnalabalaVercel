#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-icons.mjs · Ratnalabala
//
// Visits every page of the site (follows links from the home page, same site
// only) and reports, per page:
//   yuktai    yuktai icons
//   material  Material icons still used (and which ones)
//   emoji     emoji shown on the page (often used as icons)
//
// Run from the repo root:
//   node scripts/check-icons.mjs                          # live site
//   node scripts/check-icons.mjs http://localhost:3000    # local dev server
//   node scripts/check-icons.mjs https://ratnalabala.vercel.app 300   # up to 300 pages
//
// Writes icons-report.csv next to where you run it.
// Needs Playwright's Chromium once:  npx playwright install chromium
// ─────────────────────────────────────────────────────────────────────────────

import { chromium } from "@playwright/test"
import fs from "node:fs"

const START = (process.argv[2] || "https://ratnalabala.vercel.app").replace(/\/$/, "")
const MAX = Number(process.argv[3] || 200)
const origin = new URL(START).origin
const SKIP = /\.(pdf|jpe?g|png|gif|webp|svg|mp3|mp4|m4a|wav|zip|apk|docx?|xlsx?|pptx?|txt|json|xml|ico|woff2?)(\?|$)/i

const queue = [START + "/"]
const seen = new Set(queue)
const rows = []

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" })
const page = await context.newPage()

while (queue.length && rows.length < MAX) {
  const url = queue.shift()
  let r
  try {
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 })
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(800)
    r = await page.evaluate(() => {
      const svgs = [...document.querySelectorAll("svg")]
      const yuktai = svgs.filter((s) => s.querySelector(":scope > g[stroke='currentColor']") || s.dataset.variant || s.closest(".yi"))
      const material = svgs.filter((s) => s.dataset.testid && !yuktai.includes(s))
      const text = document.body ? document.body.innerText : ""
      const emoji = [...new Set(text.match(/\p{Extended_Pictographic}/gu) || [])].filter((e) => !"©®™".includes(e))
      const links = [...document.querySelectorAll("a[href]")].map((a) => a.href)
      return {
        yuktai: yuktai.length,
        material: material.length,
        materialNames: [...new Set(material.map((s) => s.dataset.testid.replace(/Icon$/, "")))],
        emoji,
        links,
      }
    })
    r.status = res ? res.status() : 0
  } catch (e) {
    r = { status: "error", yuktai: 0, material: 0, materialNames: [], emoji: [], links: [], error: e.message.split("\n")[0] }
  }

  const path = url.replace(origin, "") || "/"
  rows.push({ path, ...r })
  const flag = r.status === "error" || r.status >= 400 ? "✗" : r.material ? "!" : "✓"
  console.log(`${flag} ${String(rows.length).padStart(3)}  ${path.padEnd(48).slice(0, 48)}  yuktai ${String(r.yuktai).padStart(3)}  material ${String(r.material).padStart(2)}  emoji ${r.emoji.length}`)

  for (const l of r.links) {
    let u
    try { u = new URL(l) } catch { continue }
    if (u.origin !== origin || SKIP.test(u.pathname)) continue
    u.hash = ""
    const key = u.href.replace(/\/$/, "") || origin
    const norm = key === origin ? origin + "/" : key
    if (!seen.has(norm)) { seen.add(norm); queue.push(norm) }
  }
}
await browser.close()

// ── summary ──────────────────────────────────────────────────────────────────
const ok = rows.filter((r) => r.status !== "error" && r.status < 400)
const withMaterial = ok.filter((r) => r.material)
const allMaterial = {}
withMaterial.forEach((r) => r.materialNames.forEach((n) => (allMaterial[n] = (allMaterial[n] || 0) + 1)))
const allEmoji = {}
ok.forEach((r) => r.emoji.forEach((e) => (allEmoji[e] = (allEmoji[e] || 0) + 1)))

console.log("\n──────── summary ────────")
console.log(`pages checked:         ${rows.length}${queue.length ? ` (stopped at ${MAX}; ${queue.length} more found)` : ""}`)
console.log(`pages with errors:     ${rows.length - ok.length}`)
console.log(`yuktai icons in total: ${ok.reduce((a, r) => a + r.yuktai, 0)}`)
console.log(`pages with Material:   ${withMaterial.length}`)
if (withMaterial.length) {
  console.log("Material icons still used (pages):")
  Object.entries(allMaterial).sort((a, b) => b[1] - a[1]).forEach(([n, c]) => console.log(`   ${n.padEnd(32)} ${c}`))
  console.log("Pages:")
  withMaterial.forEach((r) => console.log(`   ${r.path}  →  ${r.materialNames.join(", ")}`))
}
if (Object.keys(allEmoji).length) {
  console.log("Emoji shown (pages): " + Object.entries(allEmoji).sort((a, b) => b[1] - a[1]).map(([e, c]) => `${e}×${c}`).join("  "))
}
const bad = rows.filter((r) => r.status === "error" || r.status >= 400)
if (bad.length) { console.log("Pages that failed to load:"); bad.forEach((r) => console.log(`   ${r.path}  ${r.status} ${r.error || ""}`)) }

const csv = ["page,status,yuktai,material,material_icons,emoji"]
  .concat(rows.map((r) => [r.path, r.status, r.yuktai, r.material, r.materialNames.join(" "), r.emoji.join(" ")].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")))
fs.writeFileSync("icons-report.csv", "﻿" + csv.join("\n"))
console.log("\nSaved icons-report.csv")
