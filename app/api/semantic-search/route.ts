import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { pipeline } from "@xenova/transformers"

let extractor:any = null
let vectorIndex:any[] = []
let initialized=false

async function init(){

if(initialized) return

const poemsDir = path.join(process.cwd(),"poems")

const files = fs.readdirSync(poemsDir)
.filter(f=>f.endsWith(".md"))

extractor = await pipeline(
"feature-extraction",
"Xenova/all-MiniLM-L6-v2"
)

for(const file of files){

const raw = fs.readFileSync(
path.join(poemsDir,file),
"utf-8"
)

const {data,content} = matter(raw)

const emb = await extractor(content)

vectorIndex.push({

vector: emb.data,

title: data.title || file.replace(".md",""),

poem: content

})

}

initialized=true

}

export async function POST(req:Request){

try{

const {question} = await req.json()

await init()

const q = await extractor(question)

let bestScore=-Infinity
let best:any=null

for(const item of vectorIndex){

const score = cosine(q.data,item.vector)

if(score>bestScore){

bestScore=score
best=item

}

}

return NextResponse.json({

title:best.title,
poem:best.poem

})

}catch{

return NextResponse.json(
{error:"semantic search failed"},
{status:500}
)

}

}

function cosine(a:any,b:any){

let dot=0
let na=0
let nb=0

for(let i=0;i<a.length;i++){

dot+=a[i]*b[i]
na+=a[i]*a[i]
nb+=b[i]*b[i]

}

return dot/(Math.sqrt(na)*Math.sqrt(nb))

}