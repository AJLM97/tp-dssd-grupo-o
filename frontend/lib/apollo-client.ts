import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:3000/graphql',
});

const authLink = new SetContextLink((prevContext) => {
  const activeUserId = typeof window !== 'undefined'
    ? localStorage.getItem('activeUserId') || '2'
    : '2';

  return {
    headers: {
      ...prevContext.headers,
      'x-usuario-id': activeUserId,
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});