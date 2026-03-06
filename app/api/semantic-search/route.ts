import { NextResponse } from "next/server"
import * as lancedb from "@lancedb/lancedb"
import { pipeline } from "@xenova/transformers"

let extractor:any = null

export async function POST(req:Request){

try{

const {question} = await req.json()

if(!extractor){

extractor = await pipeline(
"feature-extraction",
"Xenova/all-MiniLM-L6-v2"
)

}

const db = await lancedb.connect("./poemsdb")

const table = await db.openTable("poems")

const query = await extractor(question)

const result = await table
.search(query.data)
.limit(1)
.toArray()

const row = result[0]

return NextResponse.json({

title: row.title,
poem: row.poem

})

}catch{

return NextResponse.json(
{error:"semantic search failed"},
{status:500}
)

}

}