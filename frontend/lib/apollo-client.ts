import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:3000/graphql',
});

const authLink = new SetContextLink((prevContext) => {
  const sesionGuardada =
    typeof window !== "undefined"
      ? localStorage.getItem("rentar-session")
      : null;

  const sesion = sesionGuardada
    ? JSON.parse(sesionGuardada) as {
      access_token: string;
      user: { id: number };
    }
    : null;

  return {
    headers: {
      ...prevContext.headers,
      ...(sesion
        ? {
          Authorization: `Bearer ${sesion.access_token}`,
        }
        : {}),
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});