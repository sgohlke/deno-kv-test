import {
   JSON_CONTENT_TYPE_HEADER,
   logAndReturnErrorResponse,
   PersonService,
   returnDataResponse,
   returnDefaultFavicon,
} from './deps.ts'

let kv: Deno.Kv

export async function getKv() {
   if (!kv) {
      kv = await Deno.openKv()
   }
   return kv
}

async function initPersonKeyValueStore() {
   // Store all persons available in PersonService in kv
   const kv = await getKv()
   const persons = PersonService.getAllPersons()
   for (const person of persons) {
      // console.log('person is', person)
      // await kv.delete(['persons', '' + person.id])
      await kv.set(['persons', '' + person.id], person)
   }
}

async function handleRequest(request: Request): Promise<Response> {
   const kv = await getKv()
   const responseHeaders = new Headers(JSON_CONTENT_TYPE_HEADER)
   const origin = request.headers.get('origin')
   if (origin) {
      responseHeaders.set('Access-Control-Allow-Origin', origin)
   }

   const { pathname } = new URL(request.url)
   if (request.method === 'OPTIONS') {
      return new Response(undefined, { headers: responseHeaders })
   } else if (pathname.includes('/person')) {
      if (pathname === '/person' || pathname === '/person/') {
         const allPersons = []
         for await (const entry of kv.list({ prefix: ['persons'] })) {
            // console.log('Add persons to result', entry.value)
            allPersons.push(entry.value)
         }
         // console.log('all persons', allPersons)
         return returnDataResponse(allPersons, responseHeaders)
      } else if (pathname.includes('/person/')) {
         const personId = pathname.substring(8)
         const person = await kv.get(['persons', personId])
         if (!person || !person.value) {
            return logAndReturnErrorResponse(
               `No person found for id: ${personId}`,
               responseHeaders,
            )
         } else {
            return returnDataResponse(person.value, responseHeaders)
         }
      }
   } else if (pathname.includes('favicon')) {
      return returnDefaultFavicon()
   } else if (pathname === '/' || pathname === '') {
      return returnDataResponse(
         { message: 'Hello persons' },
         responseHeaders,
      )
   } 

   return logAndReturnErrorResponse(
      `Not found: ${pathname}`,
      responseHeaders,
      404,
   )
}

export async function startPersonServer(
   options: Deno.ServeOptions | Deno.ServeTlsOptions,
): Promise<Deno.HttpServer> {
   await initPersonKeyValueStore()
   return Deno.serve(options, handleRequest)
}
