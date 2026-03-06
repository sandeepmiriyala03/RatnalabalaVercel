import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { pipeline } from "@xenova/transformers"

let extractor:any = null
let vectorIndex:any[] = []
let initialized = false

export async function GET(){

try{

if(initialized){
return NextResponse.json({
status:"already indexed",
count:vectorIndex.length
})
}

const poemsDir = path.join(process.cwd(),"poems")

const files = fs.readdirSync(poemsDir)
.filter(f=>f.endsWith(".md"))

if(!extractor){

extractor = await pipeline(
"feature-extraction",
"Xenova/all-MiniLM-L6-v2"
)

}

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
poem: content.trim()

})

}

initialized = true

return NextResponse.json({
status:"indexed",
count:vectorIndex.length
})

}catch{

return NextResponse.json(
{error:"indexing failed"},
{status:500}
)

}

}