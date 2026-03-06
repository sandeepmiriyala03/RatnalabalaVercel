import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import matter from "gray-matter"

import { pipeline } from "@xenova/transformers"
import * as lancedb from "lancedb"

export async function GET(){

const db = await lancedb.connect("./poemsdb")

const extractor = await pipeline(
"feature-extraction",
"Xenova/all-MiniLM-L6-v2"
)

const poemsDir = path.join(process.cwd(),"poems")

const files = fs.readdirSync(poemsDir)
.filter(f=>f.endsWith(".md"))

const rows:any[]=[]

for(const file of files){

const raw = fs.readFileSync(
path.join(poemsDir,file),"utf-8"
)

const {data,content}=matter(raw)

const emb = await extractor(content)

rows.push({

vector: emb.data,

title: data.title || file.replace(".md",""),

poem: content

})

}

const table = await db.createTable("poems",rows)

return NextResponse.json({
status:"indexed",
count:rows.length
})

}