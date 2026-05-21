import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import matter from "gray-matter"

type Vector = number[]

interface Row {
  vector: Vector
  title: string
  poem: string
}

let extractor: any = null
let vectorIndex: Row[] = []
let initialized = false

/* INIT VECTOR INDEX */

async function init() {

if (initialized) return

// dynamic import (build error fix)
const { pipeline } = await import("@xenova/transformers")

const poemsDir = path.join(process.cwd(),"poems")

const files = fs.readdirSync(poemsDir)
.filter(f => f.endsWith(".md"))

extractor = await pipeline(
"feature-extraction",
"Xenova/all-MiniLM-L6-v2"
)

for (const file of files) {

const raw = fs.readFileSync(
path.join(poemsDir,file),
"utf-8"
)

const { data, content } = matter(raw)

const emb = await extractor(content)

const vector = meanPooling(emb.data)

vectorIndex.push({

vector,
title: data.title || file.replace(".md",""),
poem: content.trim()

})

}

initialized = true

}

/* SEARCH */

export async function POST(req: Request) {

try {

const body = await req.json()

if(!body?.question){

return NextResponse.json(
{ error:"question required"},
{ status:400 }
)

}

await init()

const qEmb = await extractor(body.question)

const qVector = meanPooling(qEmb.data)

let bestScore = -Infinity
let best: Row | null = null

for (const item of vectorIndex) {

const score = cosine(qVector,item.vector)

if (score > bestScore) {

bestScore = score
best = item

}

}

if(!best){

return NextResponse.json(
{ error:"no poem found"},
{ status:404 }
)

}

return NextResponse.json(best)

}catch{

return NextResponse.json(
{ error:"semantic search failed"},
{ status:500 }
)

}

}

/* MEAN POOLING */

function meanPooling(matrix:number[][]):Vector{

const dim = matrix[0].length
const result = new Array(dim).fill(0)

for(const row of matrix){

for(let i=0;i<dim;i++){

result[i]+=row[i]

}

}

for(let i=0;i<dim;i++){

result[i]/=matrix.length

}

return result

}

/* COSINE SIMILARITY */

function cosine(a:Vector,b:Vector){

let dot=0
let na=0
let nb=0

for(let i=0;i<a.length;i++){

dot+=a[i]*b[i]
na+=a[i]*a[i]
nb+=b[i]*b[i]

}

const denom = Math.sqrt(na)*Math.sqrt(nb)

return denom === 0 ? 0 : dot/denom

}