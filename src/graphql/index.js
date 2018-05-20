import fetch from 'node-fetch'
import FormData from 'form-data'
global.fetch = fetch
global.Blob = Buffer
global.FormData = FormData

import { ApolloClient } from 'apollo-client'
import { createUploadLink } from 'apollo-upload-client'
import { InMemoryCache } from 'apollo-cache-inmemory'

const cache = new InMemoryCache({
	addTypename: true,
	dataIdFromObject: ({ id }) => id
})

const link = createUploadLink({
	uri: `${process.env.API_URL || 'https://api.popcorn.moe'}/graphql`,
	credentials: 'include'
})

export default new ApolloClient({
	link,
	cache
})
