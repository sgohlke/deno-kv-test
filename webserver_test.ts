import { assertEquals, FAVICON_SVG_STRING, PersonService } from './deps.ts'
import { getKv, startPersonServer } from './webserver.ts'

Deno.test('Calling startPersonServer should return expected result', async () => {
   const abortController = new AbortController()
   const server = await startPersonServer({
      port: 7035,
      signal: abortController.signal,
   })

   // Test root route
   let response = await fetch('http://localhost:7035/')
   assertEquals(response.status, 200)
   let responseJson = await response.json()
   assertEquals(responseJson.message, 'Hello persons')

   // Test root route without slash
   response = await fetch('http://localhost:7035')
   assertEquals(response.status, 200)
   responseJson = await response.json()
   assertEquals(responseJson.message, 'Hello persons')

    // Test favicon route
    response = await fetch('http://localhost:7035/favicon.ico')
    assertEquals(response.status, 200)
    assertEquals(response.headers.get('content-type'), 'image/svg+xml')
    let responseText = await response.text()
    assertEquals(responseText, FAVICON_SVG_STRING)

    // Test unknown route
    response = await fetch('http://localhost:7035/unknownroute')
    assertEquals(response.status, 404)
    responseJson = await response.json()
    assertEquals(responseJson.error, 'Not found: /unknownroute')

   // Test OPTION request
   response = await fetch('http://localhost:7035/', {
      method: 'OPTIONS',
      headers: { 'Origin': 'test' },
   })
   assertEquals(response.status, 200)
   assertEquals(response.headers.get('Access-Control-Allow-Origin'), 'test')
   responseText = await response.text()
   assertEquals(responseText, '')

   // Test person route
   response = await fetch('http://localhost:7035/person/')
   assertEquals(response.status, 200)
   responseJson = await response.json()
   assertEquals(
      JSON.stringify(responseJson),
      JSON.stringify(PersonService.getAllPersons()),
   )

   // Test person/ID route for known person
   response = await fetch('http://localhost:7035/person/1')
   assertEquals(response.status, 200)
   responseJson = await response.json()
   assertEquals(
      JSON.stringify(responseJson),
      JSON.stringify(PersonService.getPersonForId('1')),
   )

   // Test person/ID route for unknown person
   response = await fetch('http://localhost:7035/person/17')
   assertEquals(response.status, 400)
   responseJson = await response.json()
   assertEquals(responseJson, { 'error': 'No person found for id: 17' })

   abortController.abort()
   await server.finished
   const kv = await getKv()
   await kv.close()
})
