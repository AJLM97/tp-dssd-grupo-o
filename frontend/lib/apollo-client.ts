import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:3000/graphql',
  }),
  cache: new InMemoryCache(),
});